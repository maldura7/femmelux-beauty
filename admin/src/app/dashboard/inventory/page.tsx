'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, CardBody, Badge } from '@/components/ui';
import { getInventory, exportInventory, bulkUpdateInventory, InventoryItem, InventoryExportItem } from '@/lib/api/products.api';
import { getAllBrands } from '@/lib/api/brands.api';
import toast from 'react-hot-toast';
import type { Product, Brand } from '@/types';

interface EditableRow {
  productId: string;
  quantity: number;
  costPrice: number;
  wholesalePrice: number;
  price: number;
  lowStockThreshold: number;
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [page, setPage] = useState(1);
  const [editingRows, setEditingRows] = useState<Record<string, EditableRow>>({});
  const [showImportModal, setShowImportModal] = useState(false);

  // Fetch brands
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => getAllBrands(),
  });
  const brands: Brand[] = Array.isArray(brandsData?.brands) ? brandsData.brands : [];

  // Fetch inventory
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['inventory', page, search, selectedBrand, stockFilter],
    queryFn: () =>
      getInventory({
        page,
        limit: 50,
        search: search || undefined,
        brandId: selectedBrand || undefined,
        inStock: stockFilter === 'in_stock' ? true : stockFilter === 'out_of_stock' ? false : undefined,
      }),
  });

  const products = inventoryData?.data || [];
  const pagination = inventoryData?.pagination;

  // Filter products for low stock
  const filteredProducts = useMemo(() => {
    if (stockFilter === 'low_stock') {
      return products.filter((p: Product) => p.quantity > 0 && p.quantity <= (p.lowStockThreshold || 10));
    }
    return products;
  }, [products, stockFilter]);

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: (items: InventoryItem[]) => bulkUpdateInventory(items),
    onSuccess: (result) => {
      const updated = result?.updated || 0;
      const errors = result?.errors || [];

      if (updated > 0) {
        toast.success(`Updated ${updated} products`);
      }
      if (errors.length > 0) {
        // Show a summary instead of individual errors to avoid toast spam
        const errorCount = errors.length;
        if (errorCount <= 3) {
          // Show individual errors if there are only a few
          errors.forEach((err) => toast.error(err));
        } else {
          // Show summary for many errors
          toast.error(`${errorCount} products failed to update. Check that SKUs match existing products.`);
          // Log all errors to console for debugging
          console.error('Bulk update errors:', errors);
        }
      }
      if (updated === 0 && errors.length === 0) {
        toast.error('No products were updated. Please check your CSV file.');
      }
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setEditingRows({});
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update inventory');
    },
  });

  // Start editing a row
  const startEditing = (product: Product) => {
    setEditingRows({
      ...editingRows,
      [product.id]: {
        productId: product.id,
        quantity: product.quantity,
        costPrice: Number(product.costPrice) || 0,
        wholesalePrice: Number(product.wholesalePrice),
        price: Number(product.price),
        lowStockThreshold: product.lowStockThreshold || 10,
      },
    });
  };

  // Cancel editing
  const cancelEditing = (productId: string) => {
    const newRows = { ...editingRows };
    delete newRows[productId];
    setEditingRows(newRows);
  };

  // Save single row
  const saveRow = (productId: string) => {
    const row = editingRows[productId];
    if (!row) return;

    bulkUpdateMutation.mutate([
      {
        productId: row.productId,
        quantity: row.quantity,
        costPrice: row.costPrice,
        wholesalePrice: row.wholesalePrice,
        price: row.price,
        lowStockThreshold: row.lowStockThreshold,
      },
    ]);
  };

  // Save all edited rows
  const saveAllEdits = () => {
    const items = Object.values(editingRows).map((row) => ({
      productId: row.productId,
      quantity: row.quantity,
      costPrice: row.costPrice,
      wholesalePrice: row.wholesalePrice,
      price: row.price,
      lowStockThreshold: row.lowStockThreshold,
    }));

    if (items.length === 0) {
      toast.error('No changes to save');
      return;
    }

    bulkUpdateMutation.mutate(items);
  };

  // Update editing row value
  const updateEditingRow = (productId: string, field: keyof EditableRow, value: number) => {
    setEditingRows({
      ...editingRows,
      [productId]: {
        ...editingRows[productId],
        [field]: value,
      },
    });
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      const data = await exportInventory(selectedBrand || undefined);

      // Convert to CSV
      // Note: SKU is formatted as ="value" to prevent Excel from converting long numbers to scientific notation
      const headers = ['SKU', 'Name', 'Brand', 'Category', 'Quantity', 'Low Stock Threshold', 'Cost Price', 'Wholesale Price', 'Retail Price', 'Status'];
      const rows = data.map((item: InventoryExportItem) => [
        `="${item.sku}"`, // Force Excel to treat SKU as text
        `"${item.name}"`,
        `"${item.brand}"`,
        `"${item.category || ''}"`,
        item.quantity,
        item.lowStockThreshold,
        item.costPrice,
        item.wholesalePrice,
        item.retailPrice,
        `"${item.status}"`,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Inventory exported successfully');
    } catch (error) {
      toast.error('Failed to export inventory');
    }
  };

  // Import from CSV
  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        toast.error('CSV file must have a header row and at least one data row');
        return;
      }

      // Skip header row
      const dataLines = lines.slice(1);

      const items: InventoryItem[] = [];
      const parseErrors: string[] = [];

      dataLines.forEach((line, index) => {
        try {
          // Simple CSV parsing - split by comma, handle quoted values
          const values: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim()); // Push last value

          // Expected columns: SKU, Name, Brand, Category, Quantity, Low Stock Threshold, Cost Price, Wholesale Price, Retail Price, Status
          // Index:             0     1     2       3         4              5                 6             7               8           9
          let sku = values[0]?.trim() || '';

          // Handle various SKU formats:
          // 1. ="773602123456" (Excel text format we export)
          // 2. "773602123456" (quoted)
          // 3. 773602123456 (plain)
          // 4. 7.73602E+11 (scientific notation - corrupted by Excel)

          // Remove ="..." wrapper
          if (sku.startsWith('="') && sku.endsWith('"')) {
            sku = sku.slice(2, -1);
          }
          // Remove regular quotes
          sku = sku.replace(/^"|"$/g, '').trim();

          // Check if SKU looks like scientific notation (corrupted by Excel)
          if (/^\d+\.?\d*[eE][+\-]?\d+$/.test(sku)) {
            parseErrors.push(`Row ${index + 2}: SKU "${sku}" appears to be in scientific notation. Please re-export the CSV and avoid opening it in Excel before importing.`);
            return;
          }

          // Skip rows with empty or invalid SKU
          if (!sku || sku.length < 2) {
            return; // Skip this row silently
          }

          const quantity = parseInt(values[4]) || 0;
          const lowStockThreshold = parseInt(values[5]) || 10;
          const costPrice = parseFloat(values[6]) || 0;
          const wholesalePrice = parseFloat(values[7]) || 0;
          const price = parseFloat(values[8]) || 0;

          items.push({
            sku,
            quantity,
            costPrice,
            wholesalePrice,
            price,
            lowStockThreshold,
          });
        } catch (e) {
          parseErrors.push(`Row ${index + 2}: Invalid format`);
        }
      });

      // Show parse errors first (like scientific notation issues)
      if (parseErrors.length > 0) {
        if (parseErrors.length <= 3) {
          parseErrors.forEach((err) => toast.error(err));
        } else {
          toast.error(`${parseErrors.length} rows had parsing errors. Check that SKUs are not in scientific notation.`);
          console.error('CSV Parse errors:', parseErrors);
        }
      }

      if (items.length === 0) {
        toast.error('No valid items found in file. Make sure SKU column has values and are not in scientific notation (e.g., 7.73E+11).');
        return;
      }

      // Show importing message
      toast.success(`Importing ${items.length} items...`);

      // Process import
      bulkUpdateMutation.mutate(items);
    } catch (error) {
      toast.error('Failed to parse import file');
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) {
      return { label: 'Out of Stock', variant: 'error' as const };
    }
    if (product.quantity <= (product.lowStockThreshold || 10)) {
      return { label: 'Low Stock', variant: 'warning' as const };
    }
    return { label: 'In Stock', variant: 'success' as const };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Inventory Management</h1>
          <p className="text-gray-600">Manage stock levels and pricing for all products</p>
        </div>
        <div className="flex items-center gap-3">
          {Object.keys(editingRows).length > 0 && (
            <Button onClick={saveAllEdits} isLoading={bulkUpdateMutation.isPending}>
              <CheckIcon className="h-4 w-4 mr-2" />
              Save All ({Object.keys(editingRows).length})
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                className="input pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Brand Filter */}
            <select
              className="input w-48"
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Brands</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>

            {/* Stock Filter */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                className="input w-40"
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value as typeof stockFilter);
                  setPage(1);
                }}
              >
                <option value="all">All Products</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Low Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Wholesale</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Retail</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                      Loading inventory...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product: Product) => {
                    const isEditing = !!editingRows[product.id];
                    const editRow = editingRows[product.id];
                    const status = getStockStatus(product);
                    const costPrice = isEditing ? editRow.costPrice : Number(product.costPrice) || 0;
                    const wholesalePrice = isEditing ? editRow.wholesalePrice : Number(product.wholesalePrice);
                    const margin = wholesalePrice > 0 ? (((wholesalePrice - costPrice) / wholesalePrice) * 100).toFixed(1) : '0';

                    return (
                      <tr key={product.id} className={isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.brand?.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.sku}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              className="input w-20 text-right"
                              value={editRow.quantity}
                              min={0}
                              onChange={(e) => updateEditingRow(product.id, 'quantity', parseInt(e.target.value) || 0)}
                            />
                          ) : (
                            <span className="text-gray-900">{product.quantity}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              className="input w-20 text-right"
                              value={editRow.lowStockThreshold}
                              min={0}
                              onChange={(e) => updateEditingRow(product.id, 'lowStockThreshold', parseInt(e.target.value) || 0)}
                            />
                          ) : (
                            <span className="text-gray-500">{product.lowStockThreshold || 10}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              className="input w-24 text-right"
                              value={editRow.costPrice}
                              min={0}
                              step="0.01"
                              onChange={(e) => updateEditingRow(product.id, 'costPrice', parseFloat(e.target.value) || 0)}
                            />
                          ) : (
                            <span className="text-gray-600">${costPrice.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              className="input w-24 text-right"
                              value={editRow.wholesalePrice}
                              min={0}
                              step="0.01"
                              onChange={(e) => updateEditingRow(product.id, 'wholesalePrice', parseFloat(e.target.value) || 0)}
                            />
                          ) : (
                            <span className="text-gray-900 font-medium">${wholesalePrice.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              className="input w-24 text-right"
                              value={editRow.price}
                              min={0}
                              step="0.01"
                              onChange={(e) => updateEditingRow(product.id, 'price', parseFloat(e.target.value) || 0)}
                            />
                          ) : (
                            <span className="text-gray-600">${Number(product.price).toFixed(2)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={Number(margin) > 0 ? 'text-success-600' : 'text-error-600'}>
                            {margin}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => saveRow(product.id)}
                                className="p-1 text-success-600 hover:bg-success-50 rounded"
                                disabled={bulkUpdateMutation.isPending}
                              >
                                <CheckIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => cancelEditing(product.id)}
                                className="p-1 text-error-600 hover:bg-error-50 rounded"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditing(product)}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, pagination.total)} of {pagination.total} products
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowImportModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">Import Inventory</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file with the following columns:
              <br />
              SKU, Name, Brand, Category, Quantity, Low Stock Threshold, Cost Price, Wholesale Price, Retail Price, Status
            </p>
            <div className="mb-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setShowImportModal(false);
                    handleImport(file);
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowImportModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
