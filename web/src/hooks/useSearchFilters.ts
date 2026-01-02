'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export interface SearchFilterState {
  query: string;
  brandIds: string[];
  categoryIds: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'popularity' | 'newest';
  page: number;
  limit: number;
}

const defaultFilters: SearchFilterState = {
  query: '',
  brandIds: [],
  categoryIds: [],
  minPrice: undefined,
  maxPrice: undefined,
  inStock: false,
  sortBy: 'relevance',
  page: 1,
  limit: 20,
};

export function useSearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<SearchFilterState>(() => {
    const query = searchParams.get('q') || '';
    const brandIds = searchParams.get('brands')?.split(',').filter(Boolean) || [];
    const categoryIds = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const inStock = searchParams.get('inStock') === 'true';
    const sortBy = (searchParams.get('sortBy') as SearchFilterState['sortBy']) || 'relevance';
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    return {
      query,
      brandIds,
      categoryIds,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      page,
      limit,
    };
  });

  // Sync filters to URL
  const syncToUrl = useCallback((newFilters: SearchFilterState) => {
    const params = new URLSearchParams();

    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.brandIds.length) params.set('brands', newFilters.brandIds.join(','));
    if (newFilters.categoryIds.length) params.set('categories', newFilters.categoryIds.join(','));
    if (newFilters.minPrice !== undefined) params.set('minPrice', newFilters.minPrice.toString());
    if (newFilters.maxPrice !== undefined) params.set('maxPrice', newFilters.maxPrice.toString());
    if (newFilters.inStock) params.set('inStock', 'true');
    if (newFilters.sortBy !== 'relevance') params.set('sortBy', newFilters.sortBy);
    if (newFilters.page > 1) params.set('page', newFilters.page.toString());
    if (newFilters.limit !== 20) params.set('limit', newFilters.limit.toString());

    const queryString = params.toString();
    const newPath = queryString ? `${pathname}?${queryString}` : pathname;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(newPath as any, { scroll: false });
  }, [router, pathname]);

  // Update a single filter
  const updateFilter = useCallback(<K extends keyof SearchFilterState>(
    key: K,
    value: SearchFilterState[K]
  ) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [key]: value,
        // Reset page when filters change (except when changing page itself)
        ...(key !== 'page' && key !== 'limit' ? { page: 1 } : {}),
      };
      syncToUrl(newFilters);
      return newFilters;
    });
  }, [syncToUrl]);

  // Update multiple filters at once
  const updateFilters = useCallback((updates: Partial<SearchFilterState>) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        ...updates,
        // Reset page when filters change (unless page is explicitly set)
        ...(!('page' in updates) ? { page: 1 } : {}),
      };
      syncToUrl(newFilters);
      return newFilters;
    });
  }, [syncToUrl]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const newFilters = {
      ...defaultFilters,
      query: filters.query, // Keep the query
    };
    setFilters(newFilters);
    syncToUrl(newFilters);
  }, [filters.query, syncToUrl]);

  // Clear a specific filter
  const clearFilter = useCallback((key: keyof SearchFilterState) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [key]: defaultFilters[key],
        page: 1, // Reset page
      };
      syncToUrl(newFilters);
      return newFilters;
    });
  }, [syncToUrl]);

  // Toggle a brand filter
  const toggleBrand = useCallback((brandId: string) => {
    setFilters((prev) => {
      const brandIds = prev.brandIds.includes(brandId)
        ? prev.brandIds.filter((id) => id !== brandId)
        : [...prev.brandIds, brandId];
      const newFilters = { ...prev, brandIds, page: 1 };
      syncToUrl(newFilters);
      return newFilters;
    });
  }, [syncToUrl]);

  // Toggle a category filter
  const toggleCategory = useCallback((categoryId: string) => {
    setFilters((prev) => {
      const categoryIds = prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId];
      const newFilters = { ...prev, categoryIds, page: 1 };
      syncToUrl(newFilters);
      return newFilters;
    });
  }, [syncToUrl]);

  // Set price range
  const setPriceRange = useCallback((min?: number, max?: number) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        minPrice: min,
        maxPrice: max,
        page: 1,
      };
      syncToUrl(newFilters);
      return newFilters;
    });
  }, [syncToUrl]);

  // Count active filters (excluding query and pagination)
  const activeFilterCount = [
    filters.brandIds.length > 0,
    filters.categoryIds.length > 0,
    filters.minPrice !== undefined,
    filters.maxPrice !== undefined,
    filters.inStock,
  ].filter(Boolean).length;

  // Sync from URL on navigation
  useEffect(() => {
    const query = searchParams.get('q') || '';
    const brandIds = searchParams.get('brands')?.split(',').filter(Boolean) || [];
    const categoryIds = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const inStock = searchParams.get('inStock') === 'true';
    const sortBy = (searchParams.get('sortBy') as SearchFilterState['sortBy']) || 'relevance';
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    setFilters({
      query,
      brandIds,
      categoryIds,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      page,
      limit,
    });
  }, [searchParams]);

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    clearFilter,
    toggleBrand,
    toggleCategory,
    setPriceRange,
    activeFilterCount,
  };
}
