'use client';

import { useState, useEffect } from 'react';
import {
  PhotoIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { resolveImageUrl } from '@/lib/utils';

interface Brand {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  images: string[];
  brand?: {
    id: string;
    name: string;
  };
  category?: string;
}

interface ImageResult {
  url: string;
  source: string;
  quality: number;
}

interface ProductWithImages extends Product {
  foundImages?: ImageResult[];
  selectedImage?: ImageResult;
  isSearching?: boolean;
  searchError?: string;
  isSaving?: boolean;
  saved?: boolean;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const ITEMS_PER_PAGE = 50;

export default function ImageScraperPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [showOnlyWithoutImages, setShowOnlyWithoutImages] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk operations
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isBulkSearching, setIsBulkSearching] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  // Preview modal
  const [previewProduct, setPreviewProduct] = useState<ProductWithImages | null>(null);

  // Fetch brands on mount
  useEffect(() => {
    fetchBrands();
  }, []);

  // Fetch products when filters or page changes
  useEffect(() => {
    fetchProducts();
    setSelectedProducts(new Set()); // Clear selection on filter/page change
  }, [selectedBrand, showOnlyWithoutImages, searchQuery, currentPage]);

  const fetchBrands = async () => {
    try {
      const response = await api.get('/brands?limit=100');
      const brandsData = response.data.data?.brands || response.data.data || [];
      setBrands(brandsData);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('limit', String(ITEMS_PER_PAGE));
      params.append('page', String(currentPage));

      if (selectedBrand) {
        params.append('brandId', selectedBrand);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      // Note: showOnlyWithoutImages is filtered client-side after fetch
      // because the API doesn't have this filter built-in

      const response = await api.get(`/products?${params.toString()}`);
      let productsData = response.data.data?.products || response.data.data || [];
      const paginationData = response.data.data?.pagination;

      // Client-side filter for products without images
      if (showOnlyWithoutImages) {
        productsData = productsData.filter((p: Product) =>
          !p.images || p.images.length === 0 || p.images.every(img => !img || img.includes('placeholder'))
        );
      }

      setProducts(productsData);
      setPagination(paginationData || null);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load products';
      const status = err?.response?.status;
      setError(`Failed to load products: ${errorMessage}${status ? ` (HTTP ${status})` : ''}`);
    } finally {
      setIsLoading(false);
    }
  };

  const hasImage = (product: Product): boolean => {
    return product.images && product.images.length > 0 && product.images.some(img => img && !img.includes('placeholder'));
  };

  const searchImagesForProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Update product state to show searching
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, isSearching: true, searchError: undefined } : p
    ));

    try {
      const response = await api.post('/image-scraper/search', {
        name: product.name,
        brand: product.brand?.name,
        sku: product.sku,
        category: product.category,
      });

      const images = response.data.data?.results || [];

      setProducts(prev => prev.map(p =>
        p.id === productId ? {
          ...p,
          isSearching: false,
          foundImages: images,
          selectedImage: images.length > 0 ? images[0] : undefined,
        } : p
      ));
    } catch (err) {
      setProducts(prev => prev.map(p =>
        p.id === productId ? {
          ...p,
          isSearching: false,
          searchError: 'Search failed',
        } : p
      ));
    }
  };

  const selectImageForProduct = (productId: string, image: ImageResult) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, selectedImage: image } : p
    ));
  };

  const saveImageForProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.selectedImage) return;

    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, isSaving: true } : p
    ));

    try {
      // Send the selected image URL to the backend
      await api.post(`/image-scraper/assign/${productId}`, {
        imageUrl: product.selectedImage.url,
      });

      setProducts(prev => prev.map(p =>
        p.id === productId ? {
          ...p,
          isSaving: false,
          saved: true,
          images: [product.selectedImage!.url],
        } : p
      ));
    } catch (err) {
      console.error('Failed to save image:', err);
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, isSaving: false } : p
      ));
      alert('Failed to save image');
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkSearch = async () => {
    if (selectedProducts.size === 0) {
      alert('Please select products first');
      return;
    }

    setIsBulkSearching(true);
    setBulkProgress({ current: 0, total: selectedProducts.size });

    const productIds = Array.from(selectedProducts);

    for (let i = 0; i < productIds.length; i++) {
      setBulkProgress({ current: i + 1, total: productIds.length });
      await searchImagesForProduct(productIds[i]);
      // Add delay to avoid rate limiting
      if (i < productIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsBulkSearching(false);
  };

  const handleBulkSave = async () => {
    const productsToSave = products.filter(p =>
      selectedProducts.has(p.id) && p.selectedImage && !p.saved
    );

    if (productsToSave.length === 0) {
      alert('No products with selected images to save');
      return;
    }

    for (const product of productsToSave) {
      await saveImageForProduct(product.id);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    alert(`Saved images for ${productsToSave.length} products`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
  };

  const productsWithFoundImages = products.filter(p => p.foundImages && p.foundImages.length > 0 && !p.saved);

  return (
    <div className="p-6 max-w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <PhotoIcon className="h-8 w-8 text-pink-600" />
          Product Image Scraper
        </h1>
        <p className="mt-2 text-gray-600">
          Find and assign images to products by searching beauty retailer websites.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              handleFilterChange();
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-pink-500 focus:border-pink-500"
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyWithoutImages}
              onChange={(e) => {
                setShowOnlyWithoutImages(e.target.checked);
                handleFilterChange();
              }}
              className="h-4 w-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
            />
            <span className="text-sm text-gray-700">Only products without images</span>
          </label>

          <div className="flex-1 min-w-[200px]">
            <form onSubmit={(e) => {
              e.preventDefault();
              handleFilterChange();
            }}>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, SKU, or brand... (press Enter)"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </form>
          </div>

          <button
            onClick={fetchProducts}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Refresh products"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {pagination && (
              <>
                Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                <span className="font-medium">{pagination.pages}</span> ({pagination.total} total products)
              </>
            )}
            {selectedProducts.size > 0 && (
              <span className="ml-2">
                (<span className="font-medium text-pink-600">{selectedProducts.size}</span> selected on this page)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkSearch}
              disabled={isBulkSearching || selectedProducts.size === 0}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isBulkSearching ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Searching {bulkProgress.current}/{bulkProgress.total}...
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  Search Selected ({selectedProducts.size})
                </>
              )}
            </button>

            <button
              onClick={handleBulkSave}
              disabled={productsWithFoundImages.length === 0}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Save All Images ({productsWithFoundImages.length})
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === products.length && products.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Image</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Found Images</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">Loading products...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No products found matching your filters
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className={product.saved ? 'bg-green-50' : ''}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="h-4 w-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900 truncate" title={product.name}>
                          {product.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.brand?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3">
                      {hasImage(product) ? (
                        <div className="h-12 w-12 rounded border overflow-hidden">
                          <img
                            src={resolveImageUrl(product.images[0]) || ''}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No image</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {product.isSearching ? (
                        <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-500" />
                      ) : product.searchError ? (
                        <span className="text-xs text-red-500">{product.searchError}</span>
                      ) : product.foundImages && product.foundImages.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {product.foundImages.slice(0, 3).map((img, idx) => (
                              <div
                                key={idx}
                                className={`h-10 w-10 rounded border-2 overflow-hidden cursor-pointer ${
                                  product.selectedImage?.url === img.url
                                    ? 'border-pink-500 ring-2 ring-pink-200'
                                    : 'border-white'
                                }`}
                                onClick={() => selectImageForProduct(product.id, img)}
                                title={`${img.source} (Quality: ${img.quality})`}
                              >
                                <img
                                  src={img.url}
                                  alt={`Option ${idx + 1}`}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          {product.foundImages.length > 3 && (
                            <button
                              onClick={() => setPreviewProduct(product)}
                              className="text-xs text-pink-600 hover:text-pink-700"
                            >
                              +{product.foundImages.length - 3} more
                            </button>
                          )}
                        </div>
                      ) : product.saved ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircleIcon className="h-4 w-4" />
                          Saved
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not searched</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => searchImagesForProduct(product.id)}
                          disabled={product.isSearching}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Search for images"
                        >
                          <MagnifyingGlassIcon className="h-4 w-4" />
                        </button>

                        {product.foundImages && product.foundImages.length > 0 && (
                          <button
                            onClick={() => setPreviewProduct(product)}
                            className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"
                            title="Preview all images"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}

                        {product.selectedImage && !product.saved && (
                          <button
                            onClick={() => saveImageForProduct(product.id)}
                            disabled={product.isSaving}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                            title="Save selected image"
                          >
                            {product.isSaving ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        {product.saved && (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, pagination.total)} of {pagination.total} products
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        currentPage === pageNum
                          ? 'bg-pink-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{previewProduct.name}</h3>
                <p className="text-sm text-gray-500">{previewProduct.brand?.name} • {previewProduct.sku}</p>
              </div>
              <button
                onClick={() => setPreviewProduct(null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <p className="text-sm text-gray-600 mb-4">
                Click on an image to select it, then save to assign it to the product.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previewProduct.foundImages?.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      selectImageForProduct(previewProduct.id, img);
                      setPreviewProduct({
                        ...previewProduct,
                        selectedImage: img,
                      });
                    }}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      previewProduct.selectedImage?.url === img.url
                        ? 'border-pink-500 ring-4 ring-pink-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Option ${idx + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2">
                      <p className="truncate">{img.source}</p>
                      <p>Quality: {img.quality}</p>
                    </div>
                    {previewProduct.selectedImage?.url === img.url && (
                      <div className="absolute top-2 right-2">
                        <CheckCircleIcon className="h-6 w-6 text-pink-500 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setPreviewProduct(null)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveImageForProduct(previewProduct.id);
                  setPreviewProduct(null);
                }}
                disabled={!previewProduct.selectedImage || previewProduct.saved}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
              >
                Save Selected Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
