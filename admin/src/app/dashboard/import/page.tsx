'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import {
  ArrowUpTrayIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import axios, { AxiosError } from 'axios';
import { createProduct, CreateProductData } from '@/lib/api/products.api';
import { createBrand, getAllBrands, CreateBrandData } from '@/lib/api/brands.api';
import type { Brand } from '@/types';

interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

// Helper to extract detailed error message from API errors
function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const data = axiosError.response?.data;

    // Handle validation errors (Record<string, string[]> format)
    if (data?.errors && typeof data.errors === 'object') {
      const errorMessages: string[] = [];
      Object.entries(data.errors).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          errorMessages.push(`${field}: ${messages.join(', ')}`);
        }
      });
      if (errorMessages.length > 0) {
        return errorMessages.join('; ');
      }
    }

    // Return the main message if available
    if (data?.message) {
      return data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

interface ImportRow {
  rowNumber: number;
  brand: string;
  productName: string;
  description: string;
  category: string;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  sku: string;
  stockQuantity: number;
  images: string;
  status: string;
  isValid: boolean;
  errors: string[];
}

interface ImportResult {
  success: boolean;
  rowNumber: number;
  productName: string;
  message: string;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const validateRow = (row: Partial<ImportRow>, rowNumber: number): ImportRow => {
    const errors: string[] = [];

    // Required field validations
    if (!row.brand?.trim()) {
      errors.push('Brand is required');
    }
    if (!row.productName?.trim()) {
      errors.push('Product Name is required');
    } else if (row.productName.trim().length < 2) {
      errors.push('Product Name must be at least 2 characters');
    }
    // Description is completely optional - no validation needed
    if (!row.retailPrice || isNaN(Number(row.retailPrice)) || Number(row.retailPrice) <= 0) {
      errors.push('Retail Price must be a positive number');
    }
    if (!row.wholesalePrice || isNaN(Number(row.wholesalePrice)) || Number(row.wholesalePrice) <= 0) {
      errors.push('Wholesale Price must be a positive number');
    }
    if (row.stockQuantity === undefined || row.stockQuantity === null || isNaN(Number(row.stockQuantity)) || Number(row.stockQuantity) < 0) {
      errors.push('Stock Quantity must be a non-negative number');
    }

    // SKU validation - if provided, must be at least 3 characters
    const skuValue = row.sku?.trim() || '';
    if (skuValue && skuValue.length < 3) {
      errors.push('SKU must be at least 3 characters');
    }

    // Validate wholesale price is not greater than retail price
    if (row.retailPrice && row.wholesalePrice && Number(row.wholesalePrice) > Number(row.retailPrice)) {
      errors.push('Wholesale Price cannot be greater than Retail Price');
    }

    // Cost price validation - should not be greater than wholesale price if provided
    const costPriceValue = Number(row.costPrice) || 0;
    if (costPriceValue > 0 && row.wholesalePrice && costPriceValue > Number(row.wholesalePrice)) {
      errors.push('Cost Price cannot be greater than Wholesale Price');
    }

    return {
      rowNumber,
      brand: row.brand?.trim() || '',
      productName: row.productName?.trim() || '',
      description: row.description?.trim() || '',
      category: row.category?.trim() || '',
      costPrice: costPriceValue,
      retailPrice: Number(row.retailPrice) || 0,
      wholesalePrice: Number(row.wholesalePrice) || 0,
      sku: skuValue,
      stockQuantity: Number(row.stockQuantity) || 0,
      images: row.images?.trim() || '',
      status: row.status?.trim()?.toLowerCase() || 'active',
      isValid: errors.length === 0,
      errors,
    };
  };

  const parseExcel = useCallback((workbook: XLSX.WorkBook) => {
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    const parsedRows: ImportRow[] = (jsonData as Record<string, unknown>[]).map((row, index) => {
      // Map Excel column headers to our data structure
      const mappedRow: Partial<ImportRow> = {
        brand: String(row['Brand'] || row['brand'] || ''),
        productName: String(row['Product Name'] || row['productName'] || row['Name'] || row['name'] || ''),
        description: String(row['Description'] || row['description'] || ''),
        category: String(row['Category'] || row['category'] || ''),
        costPrice: Number(row['Cost Price'] || row['costPrice'] || row['Cost'] || row['cost'] || 0),
        retailPrice: Number(row['Retail Price'] || row['retailPrice'] || row['Price'] || row['price'] || 0),
        wholesalePrice: Number(row['Wholesale Price'] || row['wholesalePrice'] || 0),
        sku: String(row['SKU'] || row['sku'] || ''),
        stockQuantity: Number(row['Stock Quantity'] || row['stockQuantity'] || row['Stock'] || row['stock'] || row['Quantity'] || row['quantity'] || 0),
        images: String(row['Product Images'] || row['Images'] || row['images'] || row['Image'] || row['image'] || ''),
        status: String(row['Status'] || row['status'] || row['Product Status'] || 'active'),
      };

      return validateRow(mappedRow, index + 2); // +2 because row 1 is header and Excel is 1-indexed
    });

    setParsedData(parsedRows);
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const uploadedFile = acceptedFiles[0];
      if (uploadedFile) {
        setFile(uploadedFile);
        setIsProcessing(true);
        setImportResults([]);
        setShowResults(false);

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            parseExcel(workbook);
            toast.success('File parsed successfully!');
          } catch (error) {
            toast.error('Failed to parse Excel file');
            console.error('Parse error:', error);
          } finally {
            setIsProcessing(false);
          }
        };
        reader.readAsArrayBuffer(uploadedFile);
      }
    },
    [parseExcel]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error('No data to import');
      return;
    }

    const validRows = parsedData.filter((row) => row.isValid);
    if (validRows.length === 0) {
      toast.error('No valid rows to import. Please fix the errors first.');
      return;
    }

    setIsImporting(true);
    const results: ImportResult[] = [];

    try {
      // Fetch existing brands
      const brandsResponse = await getAllBrands({ limit: 1000 });
      const existingBrands = new Map<string, Brand>();
      brandsResponse.brands.forEach((brand) => {
        existingBrands.set(brand.name.toLowerCase(), brand);
      });

      // Process each valid row
      for (const row of validRows) {
        try {
          // Check if brand exists, if not create it
          let brandId: string;
          const brandKey = row.brand.toLowerCase();

          if (existingBrands.has(brandKey)) {
            brandId = existingBrands.get(brandKey)!.id;
          } else {
            // Create new brand
            const newBrandData: CreateBrandData = {
              name: row.brand,
              minimumOrder: 0,
              status: true,
            };
            const newBrand = await createBrand(newBrandData);
            existingBrands.set(brandKey, newBrand);
            brandId = newBrand.id;
          }

          // Create the product
          const productData: CreateProductData = {
            brandId,
            name: row.productName,
            description: row.description,
            category: row.category || undefined,
            costPrice: row.costPrice || 0,
            retailPrice: row.retailPrice,
            wholesalePrice: row.wholesalePrice,
            sku: row.sku || `SKU-${Date.now()}-${row.rowNumber}`,
            stockQuantity: row.stockQuantity,
            images: row.images ? row.images.split(',').map((img) => img.trim()).filter(Boolean) : [],
            status: row.status.toLowerCase() === 'active' || row.status.toLowerCase() === 'true',
          };

          await createProduct(productData);

          results.push({
            success: true,
            rowNumber: row.rowNumber,
            productName: row.productName,
            message: 'Successfully imported',
          });
        } catch (error) {
          results.push({
            success: false,
            rowNumber: row.rowNumber,
            productName: row.productName,
            message: extractErrorMessage(error),
          });
        }
      }

      setImportResults(results);
      setShowResults(true);

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (failCount === 0) {
        toast.success(`Successfully imported ${successCount} products!`);
      } else if (successCount === 0) {
        toast.error(`Failed to import all ${failCount} products`);
      } else {
        toast.success(`Imported ${successCount} products, ${failCount} failed`);
      }
    } catch (error) {
      toast.error('Import failed. Please try again.');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const clearData = () => {
    setFile(null);
    setParsedData([]);
    setImportResults([]);
    setShowResults(false);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Brand': 'Example Brand',
        'Product Name': 'Example Product',
        'Description': 'Premium beauty product with high-quality ingredients for radiant skin',
        'Category': 'Skincare',
        'Cost Price': 10.00,
        'Retail Price': 29.99,
        'Wholesale Price': 19.99,
        'SKU': 'SKU-001',
        'Stock Quantity': 100,
        'Product Images': 'https://example.com/image1.jpg, https://example.com/image2.jpg',
        'Status': 'active',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, 'product-import-template.xlsx');
    toast.success('Template downloaded!');
  };

  const validCount = parsedData.filter((row) => row.isValid).length;
  const invalidCount = parsedData.filter((row) => !row.isValid).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800 flex items-center gap-2">
            <DocumentArrowUpIcon className="h-7 w-7 text-primary-600" />
            Import Products
          </h1>
          <p className="text-gray-600 mt-1">
            Import products and brands from an Excel spreadsheet.
          </p>
        </div>

        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          Download Template
        </button>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-secondary-800 mb-4">Upload File</h2>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-primary-600 font-medium">Drop the file here...</p>
          ) : (
            <div>
              <p className="text-gray-700 font-medium mb-1">
                Drag & drop an Excel file here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supports .xlsx, .xls, and .csv files
              </p>
            </div>
          )}
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <DocumentArrowUpIcon className="h-8 w-8 text-primary-600" />
              <div>
                <p className="font-medium text-gray-700">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={clearData}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Data Preview */}
      {parsedData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-800">Data Preview</h2>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircleIcon className="h-5 w-5" />
                {validCount} valid
              </span>
              {invalidCount > 0 && (
                <span className="flex items-center gap-1 text-sm text-red-600">
                  <XCircleIcon className="h-5 w-5" />
                  {invalidCount} invalid
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Row</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Brand</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Product Name</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Cost Price</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Wholesale Price</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Retail Price</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">SKU</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Stock</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Errors</th>
                </tr>
              </thead>
              <tbody>
                {/* Sort to show invalid rows first, then limit to 50 */}
                {[...parsedData].sort((a, b) => (a.isValid === b.isValid ? 0 : a.isValid ? 1 : -1)).slice(0, 50).map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={`border-t ${row.isValid ? '' : 'bg-red-50'}`}
                  >
                    <td className="px-3 py-2 text-gray-600">{row.rowNumber}</td>
                    <td className="px-3 py-2">
                      {row.isValid ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{row.brand}</td>
                    <td className="px-3 py-2 text-gray-700 max-w-xs truncate">{row.productName}</td>
                    <td className="px-3 py-2 text-gray-700">{row.category || '-'}</td>
                    <td className="px-3 py-2 text-gray-700">${row.costPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-700">${row.wholesalePrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-700">${row.retailPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-700">{row.sku || '-'}</td>
                    <td className="px-3 py-2 text-gray-700">{row.stockQuantity}</td>
                    <td className="px-3 py-2">
                      {row.errors.length > 0 && (
                        <div className="text-xs text-red-600">
                          {row.errors.join('; ')}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 20 && (
              <p className="text-sm text-gray-500 mt-3 px-3">
                Showing {Math.min(50, parsedData.length)} of {parsedData.length} rows (invalid rows shown first)...
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t">
            <button
              onClick={clearData}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || validCount === 0}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  Importing...
                </>
              ) : (
                <>
                  <ArrowUpTrayIcon className="h-5 w-5" />
                  Import {validCount} Products
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Import Results */}
      {showResults && importResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-secondary-800 mb-4">Import Results</h2>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {importResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  result.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                {result.success ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    Row {result.rowNumber}: {result.productName}
                  </p>
                  <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-yellow-800 mb-3">
          <ExclamationTriangleIcon className="h-6 w-6" />
          Import Instructions
        </h3>
        <ul className="space-y-2 text-yellow-700">
          <li className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span>Download the template file to see the required format.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>
              <strong>Required fields:</strong> Brand, Product Name (min 2 chars), Retail Price, Wholesale Price, Stock Quantity
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>
              <strong>Optional fields:</strong> Description, Cost Price, Category, SKU (min 3 chars if provided), Product Images, Status
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>
              If a brand doesn't exist, it will be automatically created.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">5.</span>
            <span>
              For multiple images, separate URLs with commas.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">6.</span>
            <span>
              Status should be either "active" or "inactive".
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">7.</span>
            <span>
              <strong>SKU must be unique.</strong> If a product with the same SKU already exists, the import will fail for that row.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
