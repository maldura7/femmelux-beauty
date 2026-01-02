'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CubeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Card, CardBody, Button, Badge, Spinner } from '@/components/ui';
import { ProductFilters, ProductFiltersState } from '@/components/products/ProductFilters';
import { DeleteProductDialog } from '@/components/products/DeleteProductDialog';
import { getAllProducts, deleteProduct } from '@/lib/api/products.api';
import { getAllBrands } from '@/lib/api/brands.api';
import { formatCurrency, resolveImageUrl } from '@/lib/utils';
import type { Product, Brand } from '@/types';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<ProductFiltersState>({
    search: searchParams.get('search') || '',
    brandId: searchParams.get('brandId') || '',
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch brands for filter dropdown
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => getAllBrands(),
  });

  const brands: Brand[] = Array.isArray(brandsData?.brands) ? brandsData.brands : [];

  // Fetch products with filters
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['products', filters, currentPage],
    queryFn: () =>
      getAllProducts({
        search: filters.search || undefined,
        brandId: filters.brandId || undefined,
        category: filters.category || undefined,
        status: filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product');
    },
  });

  const products: Product[] = Array.isArray(productsData?.data) ? productsData.data : [];
  const pagination = productsData?.pagination || { total: 0, pages: 1, page: 1, limit: ITEMS_PER_PAGE };

  const handleFilterChange = useCallback((newFilters: ProductFiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedProduct) {
      deleteMutation.mutate(selectedProduct.id);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get stock status styling
  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { text: 'Out of Stock', className: 'text-error-500 font-medium' };
    if (quantity < 10) return { text: `${quantity} left`, className: 'text-error-500' };
    if (quantity < 50) return { text: `${quantity}`, className: 'text-warning-500' };
    return { text: `${quantity}`, className: 'text-success-600' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-error-500">Failed to load products</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Link href="/dashboard/products/create">
          <Button>
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary-100">
              <CubeIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-secondary-800">{pagination.total}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success-100">
              <CubeIcon className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-secondary-800">
                {products.filter((p) => p.status).length}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning-100">
              <CubeIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-secondary-800">
                {products.filter((p) => p.quantity > 0 && p.quantity < 50).length}
              </p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-error-100">
              <CubeIcon className="h-6 w-6 text-error-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold text-secondary-800">
                {products.filter((p) => p.quantity === 0).length}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <ProductFilters
            brands={brands}
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </CardBody>
      </Card>

      {/* Products table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <CubeIcon className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 mb-2">
                        {filters.search || filters.brandId || filters.category || filters.status
                          ? 'No products found matching your filters.'
                          : 'No products yet. Create your first product!'}
                      </p>
                      {!filters.search && !filters.brandId && !filters.category && !filters.status && (
                        <Link href="/dashboard/products/create">
                          <Button size="sm">
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Add Product
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const stockStatus = getStockStatus(product.quantity || 0);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center gap-3">
                          {product.images && product.images.length > 0 ? (
                            <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <Image
                                src={resolveImageUrl(product.images[0]) || ''}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <CubeIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-secondary-800 truncate max-w-[200px]">
                              {product.name}
                            </p>
                            {product.category && (
                              <p className="text-xs text-gray-500">{product.category}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-gray-500 font-mono text-sm">{product.sku}</td>
                      <td>
                        {product.brand ? (
                          <Link
                            href={`/dashboard/brands/${product.brandId}/products`}
                            className="text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            {product.brand.name}
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-secondary-800">
                            {formatCurrency(product.wholesalePrice || 0)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Retail: {formatCurrency(product.price || 0)}
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className={stockStatus.className}>{stockStatus.text}</span>
                      </td>
                      <td>
                        <Badge variant={product.status ? 'success' : 'error'}>
                          {product.status ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
                            title="Edit Product"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(product)}
                            className="text-error-500 hover:text-error-600 hover:bg-error-50"
                            title="Delete Product"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, pagination.total)} of {pagination.total}{' '}
              products
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first, last, and pages around current
                  if (page === 1 || page === pagination.pages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, index, array) => {
                  // Add ellipsis
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-2">
                      {showEllipsis && <span className="text-gray-400">...</span>}
                      <Button
                        variant={page === currentPage ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="min-w-[36px]"
                      >
                        {page}
                      </Button>
                    </div>
                  );
                })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.pages}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteProductDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleConfirmDelete}
        productName={selectedProduct?.name || ''}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
