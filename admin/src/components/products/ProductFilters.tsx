'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import type { Brand } from '@/types';

export interface ProductFiltersState {
  search: string;
  brandId: string;
  category: string;
  status: string;
}

interface ProductFiltersProps {
  brands: Brand[];
  filters: ProductFiltersState;
  onFilterChange: (filters: ProductFiltersState) => void;
  isLoading?: boolean;
}

export function ProductFilters({
  brands,
  filters,
  onFilterChange,
  isLoading = false,
}: ProductFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFilterChange({ ...filters, search: localSearch });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, filters, onFilterChange]);

  const handleBrandChange = (brandId: string) => {
    onFilterChange({ ...filters, brandId });
  };

  const handleCategoryChange = (category: string) => {
    onFilterChange({ ...filters, category });
  };

  const handleStatusChange = (status: string) => {
    onFilterChange({ ...filters, status });
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    onFilterChange({
      search: '',
      brandId: '',
      category: '',
      status: '',
    });
  };

  const hasActiveFilters =
    filters.search || filters.brandId || filters.category || filters.status;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="input pl-10 pr-10"
            disabled={isLoading}
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => setLocalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Brand Filter */}
        <div className="min-w-[180px]">
          <select
            value={filters.brandId}
            onChange={(e) => handleBrandChange(e.target.value)}
            className="input"
            disabled={isLoading}
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="min-w-[150px]">
          <input
            type="text"
            placeholder="Category..."
            value={filters.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="input"
            disabled={isLoading}
          />
        </div>

        {/* Status Filter */}
        <div className="min-w-[140px]">
          <select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="input"
            disabled={isLoading}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClearFilters}
            disabled={isLoading}
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FunnelIcon className="h-4 w-4" />
          <span>Active filters:</span>
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs">
                Search: "{filters.search}"
                <button
                  onClick={() => {
                    setLocalSearch('');
                    onFilterChange({ ...filters, search: '' });
                  }}
                  className="ml-1 hover:text-primary-900"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.brandId && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs">
                Brand: {brands.find((b) => b.id === filters.brandId)?.name}
                <button
                  onClick={() => onFilterChange({ ...filters, brandId: '' })}
                  className="ml-1 hover:text-primary-900"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs">
                Category: {filters.category}
                <button
                  onClick={() => onFilterChange({ ...filters, category: '' })}
                  className="ml-1 hover:text-primary-900"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs">
                Status: {filters.status}
                <button
                  onClick={() => onFilterChange({ ...filters, status: '' })}
                  className="ml-1 hover:text-primary-900"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductFilters;
