'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { NoResults } from '@/components/search/NoResults';
import { MobileFiltersDrawer } from '@/components/search/MobileFiltersDrawer';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import {
  searchProductsWithFilters,
  getPopularSearches,
  SearchResults,
  PopularSearch,
  transformSearchProduct,
} from '@/lib/api/search.api';
import { getBrands, Brand } from '@/lib/api/brands.api';
import type { Category } from '@/lib/api/categories.api';
import { Product } from '@/lib/api/products.api';

type ViewMode = 'grid' | 'list';
type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'popularity' | 'newest';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
];

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  // State
  const [results, setResults] = useState<SearchResults | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);

  // Hooks
  const {
    filters,
    updateFilter,
    clearFilters,
    toggleBrand,
    toggleCategory,
    setPriceRange,
    activeFilterCount,
  } = useSearchFilters();
  const { addToHistory } = useSearchHistory();

  // Fetch brands and categories on mount
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        // Fetch brands and popular searches (categories endpoint doesn't exist yet)
        const [brandsResponse, popularData] = await Promise.all([
          getBrands(),
          getPopularSearches(10),
        ]);
        setBrands(brandsResponse.data);
        setPopularSearches(popularData);

        // Categories API doesn't exist yet, so we skip it
        // TODO: Uncomment when categories endpoint is implemented
        // const categoriesResponse = await getCategories();
        // setCategories(categoriesResponse.data);
      } catch (error) {
        console.error('Error fetching filter data:', error);
      }
    };

    fetchFiltersData();
  }, []);

  // Perform search when query or filters change
  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setResults(null);
        setProducts([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchFilters = {
          brandId: filters.brandIds[0], // API currently supports single brand
          categoryId: filters.categoryIds[0], // API currently supports single category
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          inStock: filters.inStock || undefined,
          page: filters.page,
          limit: filters.limit,
          sortBy: filters.sortBy,
        };

        const data = await searchProductsWithFilters(query, searchFilters);
        setResults(data);
        setProducts(data.products.map(transformSearchProduct));

        // Add to search history
        addToHistory(query);
      } catch (error) {
        console.error('Error searching products:', error);
        setResults(null);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query, filters, addToHistory]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(`/search?q=${encodeURIComponent(suggestion)}` as any);
  }, [router]);

  // Handle add to cart
  const handleAddToCart = useCallback((product: Product) => {
    // TODO: Implement cart functionality
    console.log('Add to cart:', product);
  }, []);

  // Pagination
  const handlePageChange = useCallback((page: number) => {
    updateFilter('page', page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [updateFilter]);

  // Format brands and categories for filters
  const filterBrands = brands.map((b) => ({ id: b.id, name: b.name }));
  const filterCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    children: c.children?.map((child) => ({ id: child.id, name: child.name })),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SearchBar
            className="max-w-2xl mx-auto"
            placeholder="Search products, brands..."
            autoFocus={!query}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Results Header */}
        {query && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isLoading ? (
                'Searching...'
              ) : results ? (
                <>
                  {results.total} result{results.total !== 1 ? 's' : ''} for &quot;{query}&quot;
                </>
              ) : (
                `Search for "${query}"`
              )}
            </h1>

            {/* Did You Mean */}
            {results?.suggestion && (
              <p className="mt-2 text-gray-600">
                Did you mean:{' '}
                <button
                  onClick={() => handleSuggestionClick(results.suggestion!)}
                  className="text-pink-600 font-semibold hover:text-pink-700 underline"
                >
                  {results.suggestion}
                </button>
                ?
              </p>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <SearchFilters
              brands={filterBrands}
              categories={filterCategories}
              selectedBrands={filters.brandIds}
              selectedCategories={filters.categoryIds}
              minPrice={filters.minPrice}
              maxPrice={filters.maxPrice}
              inStock={filters.inStock}
              onBrandChange={toggleBrand}
              onCategoryChange={toggleCategory}
              onPriceChange={setPriceRange}
              onInStockChange={(value) => updateFilter('inStock', value)}
              onClearAll={clearFilters}
              activeFilterCount={activeFilterCount}
            />
          </aside>

          {/* Results Area */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg border border-gray-200">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FunnelIcon className="h-5 w-5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 text-xs font-medium bg-pink-600 text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value as SortOption)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2 text-sm font-medium text-gray-700 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      Sort: {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-pink-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-pink-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* No Query State */}
            {!query && !isLoading && (
              <div className="text-center py-16">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Start searching to find products
                </h2>
                {popularSearches.length > 0 && (
                  <div className="mt-8">
                    <p className="text-gray-600 mb-4">Popular searches:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {popularSearches.map((search) => (
                        <button
                          key={search.query}
                          onClick={() => handleSuggestionClick(search.query)}
                          className="px-4 py-2 bg-gray-100 hover:bg-pink-100 text-gray-700 hover:text-pink-700 rounded-full text-sm transition-colors"
                        >
                          {search.query}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No Results State */}
            {query && !isLoading && results && results.total === 0 && (
              <NoResults
                query={query}
                suggestion={results.suggestion}
                popularSearches={popularSearches.map((p) => p.query)}
                popularCategories={categories.slice(0, 5).map((c) => ({
                  name: c.name,
                  slug: c.slug,
                }))}
                onSuggestionClick={handleSuggestionClick}
              />
            )}

            {/* Results Grid/List */}
            {!isLoading && products.length > 0 && (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }
                >
                  {products.map((product) => (
                    <SearchResultCard
                      key={product.id}
                      product={product}
                      searchQuery={query}
                      view={viewMode}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {results && results.pages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page <= 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(results.pages, 5) }, (_, i) => {
                        let page: number;
                        if (results.pages <= 5) {
                          page = i + 1;
                        } else if (filters.page <= 3) {
                          page = i + 1;
                        } else if (filters.page >= results.pages - 2) {
                          page = results.pages - 4 + i;
                        } else {
                          page = filters.page - 2 + i;
                        }

                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                              filters.page === page
                                ? 'bg-pink-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page >= results.pages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <MobileFiltersDrawer
        isOpen={showMobileFilters}
        onClose={() => setShowMobileFilters(false)}
        brands={filterBrands}
        categories={filterCategories}
        selectedBrands={filters.brandIds}
        selectedCategories={filters.categoryIds}
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        inStock={filters.inStock}
        onBrandChange={toggleBrand}
        onCategoryChange={toggleCategory}
        onPriceChange={setPriceRange}
        onInStockChange={(value) => updateFilter('inStock', value)}
        onClearAll={clearFilters}
        activeFilterCount={activeFilterCount}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
