'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import type { Brand } from '@/types';
import type { OrderStatus } from './OrderStatusBadge';

export interface OrderFiltersState {
  search: string;
  status: OrderStatus | '';
  brandId: string;
  dateFrom: string;
  dateTo: string;
}

interface OrderFiltersProps {
  brands: Brand[];
  filters: OrderFiltersState;
  onFilterChange: (filters: OrderFiltersState) => void;
  isLoading?: boolean;
}

const statusOptions: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function OrderFilters({
  brands,
  filters,
  onFilterChange,
  isLoading = false,
}: OrderFiltersProps) {
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

  const handleStatusChange = (status: OrderStatus | '') => {
    onFilterChange({ ...filters, status });
  };

  const handleBrandChange = (brandId: string) => {
    onFilterChange({ ...filters, brandId });
  };

  const handleDateFromChange = (dateFrom: string) => {
    onFilterChange({ ...filters, dateFrom });
  };

  const handleDateToChange = (dateTo: string) => {
    onFilterChange({ ...filters, dateTo });
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    onFilterChange({
      search: '',
      status: '',
      brandId: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.brandId ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* Customer Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order # or customer..."
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

        {/* Status Filter */}
        <div className="min-w-[160px]">
          <select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value as OrderStatus | '')}
            className="input"
            disabled={isLoading}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Brand Filter */}
        <div className="min-w-[160px]">
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

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="input"
            placeholder="From"
            disabled={isLoading}
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="input"
            placeholder="To"
            disabled={isLoading}
          />
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
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs">
                Status: {statusOptions.find((s) => s.value === filters.status)?.label}
                <button
                  onClick={() => onFilterChange({ ...filters, status: '' })}
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
            {(filters.dateFrom || filters.dateTo) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs">
                Date: {filters.dateFrom || '...'} - {filters.dateTo || '...'}
                <button
                  onClick={() => onFilterChange({ ...filters, dateFrom: '', dateTo: '' })}
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

export default OrderFilters;
