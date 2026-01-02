'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';
import { SearchFilters } from '@/components/search/SearchFilters';
import { MobileFiltersDrawer } from '@/components/search/MobileFiltersDrawer';
import { getProducts, ProductFilters, Product } from '@/lib/api/products.api';
import { getBrands, Brand } from '@/lib/api/brands.api';
import { useAuthStore } from '@/store/auth.store';

const PRODUCTS_PER_PAGE = 12;

const sortOptions = [
  { value: 'createdAt:desc', label: 'Newest' },
  { value: 'createdAt:asc', label: 'Oldest' },
  { value: 'name:asc', label: 'Name: A-Z' },
  { value: 'name:desc', label: 'Name: Z-A' },
  { value: 'price:asc', label: 'Price: Low to High' },
  { value: 'price:desc', label: 'Price: High to Low' },
];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter state from URL params
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'createdAt:desc';
  const brandsParam = searchParams.get('brands') || '';
  const categoriesParam = searchParams.get('categories') || '';
  const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
  const inStock = searchParams.get('inStock') === 'true';

  // Memoize arrays to prevent infinite re-renders
  const selectedBrands = useMemo(() =>
    brandsParam ? brandsParam.split(',').filter(Boolean) : [],
    [brandsParam]
  );
  const selectedCategories = useMemo(() =>
    categoriesParam ? categoriesParam.split(',').filter(Boolean) : [],
    [categoriesParam]
  );

  // Parse sort option
  const [sortBy, sortOrder] = sort.split(':') as [ProductFilters['sortBy'], ProductFilters['sortOrder']];

  // Update URL with filters
  const updateFilters = useCallback((updates: Record<string, string | string[] | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, value);
      }
    });

    // Reset to page 1 when filters change (except for page itself)
    if (!('page' in updates)) {
      params.set('page', '1');
    }

    router.push(`/products?${params.toString()}` as '/');
  }, [router, searchParams]);

  // Fetch brands on mount
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const brandsRes = await getBrands({ limit: 100 });
        setBrands(brandsRes.data);
      } catch (err) {
        console.error('Failed to fetch filter data:', err);
      }
    };
    fetchFiltersData();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const filters: ProductFilters = {
          page,
          limit: PRODUCTS_PER_PAGE,
          search: search || undefined,
          sortBy: sortBy as ProductFilters['sortBy'],
          sortOrder: sortOrder as ProductFilters['sortOrder'],
          minPrice,
          maxPrice,
          inStock: inStock || undefined,
        };

        // Note: The backend may not support multiple brand/category filters
        // If it does, we'd include them here
        if (selectedBrands.length === 1) {
          filters.brandId = selectedBrands[0];
        }
        if (selectedCategories.length === 1) {
          filters.categoryId = selectedCategories[0];
        }

        const result = await getProducts(filters);
        setProducts(result.data);
        setTotalProducts(result.pagination.total);
        setTotalPages(result.pagination.pages);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [page, search, sortBy, sortOrder, selectedBrands, selectedCategories, minPrice, maxPrice, inStock]);

  // Filter handlers
  const handleBrandChange = (brandId: string) => {
    const newBrands = selectedBrands.includes(brandId)
      ? selectedBrands.filter((id) => id !== brandId)
      : [...selectedBrands, brandId];
    updateFilters({ brands: newBrands });
  };

  const handleCategoryChange = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];
    updateFilters({ categories: newCategories });
  };

  const handlePriceChange = (min?: number, max?: number) => {
    updateFilters({
      minPrice: min?.toString(),
      maxPrice: max?.toString(),
    });
  };

  const handleInStockChange = (value: boolean) => {
    updateFilters({ inStock: value ? 'true' : undefined });
  };

  const handleSortChange = (value: string) => {
    updateFilters({ sort: value });
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get('search') as string;
    updateFilters({ search: searchValue || undefined });
  };

  const handleClearAll = () => {
    router.push('/products' as '/');
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate active filter count (categories not supported)
  const activeFilterCount =
    selectedBrands.length +
    (minPrice !== undefined ? 1 : 0) +
    (maxPrice !== undefined ? 1 : 0) +
    (inStock ? 1 : 0);

  // Convert brands to filter format (categories not supported by backend)
  const filterBrands = brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    count: brand.productCount,
  }));

  // Empty categories since backend doesn't have categories endpoint
  const filterCategories: { id: string; name: string; count?: number; children?: { id: string; name: string; count?: number }[] }[] = [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-gray-600">
            Browse our wholesale beauty product catalog
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <SearchFilters
              brands={filterBrands}
              categories={filterCategories}
              selectedBrands={selectedBrands}
              selectedCategories={selectedCategories}
              minPrice={minPrice}
              maxPrice={maxPrice}
              inStock={inStock}
              onBrandChange={handleBrandChange}
              onCategoryChange={handleCategoryChange}
              onPriceChange={handlePriceChange}
              onInStockChange={handleInStockChange}
              onClearAll={handleClearAll}
              activeFilterCount={activeFilterCount}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Sort Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="search"
                      defaultValue={search}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => updateFilters({ search: undefined })}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                </form>

                {/* Sort */}
                <div className="flex items-center gap-4">
                  <select
                    value={sort}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none bg-white"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {/* View Toggle */}
                  <div className="hidden sm:flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      title="Grid view"
                    >
                      <Squares2X2Icon className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      title="List view"
                    >
                      <ListBulletIcon className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setShowMobileFilters(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <FunnelIcon className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700">Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 text-xs font-medium bg-pink-600 text-white rounded-full">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Active Filters Tags */}
              {(activeFilterCount > 0 || search) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {search && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 text-sm rounded-full">
                      Search: {search}
                      <button
                        onClick={() => updateFilters({ search: undefined })}
                        className="hover:text-pink-900"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                  {selectedBrands.map((brandId) => {
                    const brand = brands.find((b) => b.id === brandId);
                    return brand ? (
                      <span
                        key={brandId}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 text-sm rounded-full"
                      >
                        {brand.name}
                        <button
                          onClick={() => handleBrandChange(brandId)}
                          className="hover:text-pink-900"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </span>
                    ) : null;
                  })}
                  {(minPrice !== undefined || maxPrice !== undefined) && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 text-sm rounded-full">
                      Price: ${minPrice || 0} - ${maxPrice || '∞'}
                      <button
                        onClick={() => handlePriceChange(undefined, undefined)}
                        className="hover:text-pink-900"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                  {inStock && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 text-sm rounded-full">
                      In Stock Only
                      <button
                        onClick={() => handleInStockChange(false)}
                        className="hover:text-pink-900"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  )}
                  {activeFilterCount > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600">
              {isLoading ? (
                'Loading...'
              ) : (
                <>
                  Showing {products.length} of {totalProducts} products
                  {search && ` for "${search}"`}
                </>
              )}
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {Array.from({ length: PRODUCTS_PER_PAGE }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && products.length === 0 && (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <MagnifyingGlassIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">
                  {search
                    ? `No products match "${search}". Try a different search term.`
                    : 'No products match your current filters.'}
                </p>
                <button
                  onClick={handleClearAll}
                  className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Products Grid */}
            {!isLoading && !error && products.length > 0 && (
              <>
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      user={user}
                      showBrand
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-10 h-10 rounded-lg font-medium ${
                              pageNum === page
                                ? 'bg-pink-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <MobileFiltersDrawer
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        brands={filterBrands}
        categories={filterCategories}
        selectedBrands={selectedBrands}
        selectedCategories={selectedCategories}
        minPrice={minPrice}
        maxPrice={maxPrice}
        inStock={inStock}
        onBrandChange={handleBrandChange}
        onCategoryChange={handleCategoryChange}
        onPriceChange={handlePriceChange}
        onInStockChange={handleInStockChange}
        onClearAll={handleClearAll}
        activeFilterCount={activeFilterCount}
      />
    </div>
  );
}
