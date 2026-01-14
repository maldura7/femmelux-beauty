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
import axios from 'axios';
import { apiClient } from '@/lib/api/client';

// Helper to extract detailed error message from API errors
function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

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

interface BulkImportProgress {
  totalBatches: number;
  completedBatches: number;
  totalProducts: number;
  createdProducts: number;
  skippedProducts: number;
  errors: string[];
}

interface BulkImportResponse {
  success: boolean;
  message: string;
  data: {
    created: number;
    skipped: number;
    total: number;
    brandStats: Record<string, number>;
  };
  errors?: string[];
  hasMoreErrors?: boolean;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [importProgress, setImportProgress] = useState<BulkImportProgress | null>(null);

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
    setImportProgress(null);
    const results: ImportResult[] = [];

    // Batch size - send 500 products per request for optimal performance
    const BATCH_SIZE = 500;
    const batches: ImportRow[][] = [];

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      batches.push(validRows.slice(i, i + BATCH_SIZE));
    }

    // Initialize progress
    const progress: BulkImportProgress = {
      totalBatches: batches.length,
      completedBatches: 0,
      totalProducts: validRows.length,
      createdProducts: 0,
      skippedProducts: 0,
      errors: [],
    };
    setImportProgress(progress);

    try {
      // Process batches sequentially
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];

        // Transform rows to API format
        const products = batch.map((row) => ({
          name: row.productName,
          brandName: row.brand,
          description: row.description || '',
          costPrice: row.costPrice || 0,
          wholesalePrice: row.wholesalePrice,
          price: row.retailPrice,
          sku: row.sku || `SKU-${Date.now()}-${row.rowNumber}`,
          images: row.images ? row.images.split(',').map((img) => img.trim()).filter(Boolean) : [],
          quantity: row.stockQuantity,
          category: row.category || undefined,
        }));

        try {
          const response = await apiClient.post<BulkImportResponse>('/products/bulk-import', {
            products,
          });

          const data = response.data;

          // Update progress
          progress.completedBatches = batchIndex + 1;
          progress.createdProducts += data.data.created;
          progress.skippedProducts += data.data.skipped;

          if (data.errors && data.errors.length > 0) {
            progress.errors.push(...data.errors.slice(0, 10)); // Limit errors stored
          }

          setImportProgress({ ...progress });

          // Add batch results
          batch.forEach((row) => {
            results.push({
              success: true,
              rowNumber: row.rowNumber,
              productName: row.productName,
              message: 'Processed in batch ' + (batchIndex + 1),
            });
          });

          // Show progress toast for large imports
          if (batches.length > 1) {
            toast.success(`Batch ${batchIndex + 1}/${batches.length} complete: ${data.data.created} created`, {
              duration: 2000,
            });
          }
        } catch (error) {
          const errorMessage = extractErrorMessage(error);
          progress.errors.push(`Batch ${batchIndex + 1} failed: ${errorMessage}`);
          setImportProgress({ ...progress });

          // Mark all items in failed batch as failed
          batch.forEach((row) => {
            results.push({
              success: false,
              rowNumber: row.rowNumber,
              productName: row.productName,
              message: `Batch failed: ${errorMessage}`,
            });
          });

          toast.error(`Batch ${batchIndex + 1} failed: ${errorMessage}`);
        }
      }

      setImportResults(results);
      setShowResults(true);

      // Final summary
      if (progress.errors.length === 0) {
        toast.success(`Successfully imported ${progress.createdProducts} products!`);
      } else {
        toast.success(
          `Imported ${progress.createdProducts} products, ${progress.skippedProducts} skipped, ${progress.errors.length} errors`
        );
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
    setImportProgress(null);
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

          {/* Progress Display */}
          {importProgress && isImporting && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-3">Import Progress</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-blue-700">
                  <span>Batch {importProgress.completedBatches} of {importProgress.totalBatches}</span>
                  <span>{Math.round((importProgress.completedBatches / importProgress.totalBatches) * 100)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress.completedBatches / importProgress.totalBatches) * 100}%` }}
                  />
                </div>
                <div className="flex gap-4 text-sm mt-2">
                  <span className="text-green-600">Created: {importProgress.createdProducts}</span>
                  <span className="text-yellow-600">Skipped: {importProgress.skippedProducts}</span>
                  {importProgress.errors.length > 0 && (
                    <span className="text-red-600">Errors: {importProgress.errors.length}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t">
            <button
              onClick={clearData}
              disabled={isImporting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
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
                  Importing... {importProgress ? `(${importProgress.completedBatches}/${importProgress.totalBatches})` : ''}
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
      {showResults && importProgress && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-secondary-800 mb-4">Import Results</h2>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{importProgress.totalProducts}</p>
              <p className="text-sm text-gray-600">Total Processed</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{importProgress.createdProducts}</p>
              <p className="text-sm text-green-700">Created</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{importProgress.skippedProducts}</p>
              <p className="text-sm text-yellow-700">Skipped (duplicates)</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{importProgress.errors.length}</p>
              <p className="text-sm text-red-700">Errors</p>
            </div>
          </div>

          {/* Error Details */}
          {importProgress.errors.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-red-700 mb-2">Errors:</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-red-50 rounded-lg p-3">
                {importProgress.errors.map((error, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-red-600">
                    <XCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          {importProgress.errors.length === 0 && importProgress.createdProducts > 0 && (
            <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-semibold text-green-700">Import Completed Successfully!</p>
                <p className="text-sm text-green-600">
                  All {importProgress.createdProducts} products have been imported.
                </p>
              </div>
            </div>
          )}
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
