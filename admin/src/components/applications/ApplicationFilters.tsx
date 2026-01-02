'use client';

import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import {
  ApplicationStatus,
  ApplicationType,
  ApplicationFilters as Filters,
} from '@/lib/api/applications.api';

// ============================================
// TYPES
// ============================================

interface ApplicationFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  pendingCount?: number;
}

// ============================================
// APPLICATION FILTERS COMPONENT
// ============================================

export default function ApplicationFilters({
  filters,
  onFiltersChange,
  pendingCount = 0,
}: ApplicationFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const statusTabs: { value: ApplicationStatus | undefined; label: string; count?: number }[] = [
    { value: undefined, label: 'All' },
    { value: 'PENDING', label: 'Pending', count: pendingCount },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  const handleStatusChange = (status: ApplicationStatus | undefined) => {
    onFiltersChange({ ...filters, status, page: 1 });
  };

  const handleTypeChange = (applicationType: ApplicationType | undefined) => {
    onFiltersChange({ ...filters, applicationType, page: 1 });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search, page: 1 });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({ ...filters, [field]: value || undefined, page: 1 });
  };

  const handleSortChange = (sortBy: 'submittedAt' | 'reviewedAt', sortOrder: 'asc' | 'desc') => {
    onFiltersChange({ ...filters, sortBy, sortOrder });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: undefined,
      applicationType: undefined,
      search: undefined,
      startDate: undefined,
      endDate: undefined,
      sortBy: 'submittedAt',
      sortOrder: 'desc',
      page: 1,
      limit: filters.limit,
    });
  };

  const hasActiveFilters =
    filters.applicationType ||
    filters.search ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {statusTabs.map((tab) => {
            const isActive = filters.status === tab.value;
            return (
              <button
                key={tab.value || 'all'}
                onClick={() => handleStatusChange(tab.value)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    isActive
                      ? 'border-gold text-gold'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs font-semibold ${
                      isActive
                        ? 'bg-gold text-white'
                        : tab.value === 'PENDING'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search and Filters Row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or business..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
          />
        </div>

        {/* Type Filter */}
        <select
          value={filters.applicationType || ''}
          onChange={(e) =>
            handleTypeChange((e.target.value as ApplicationType) || undefined)
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
        >
          <option value="">All Types</option>
          <option value="CUSTOMER">Customers</option>
          <option value="VENDOR">Vendors</option>
        </select>

        {/* Sort */}
        <select
          value={`${filters.sortBy || 'submittedAt'}-${filters.sortOrder || 'desc'}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-') as [
              'submittedAt' | 'reviewedAt',
              'asc' | 'desc'
            ];
            handleSortChange(sortBy, sortOrder);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
        >
          <option value="submittedAt-desc">Newest First</option>
          <option value="submittedAt-asc">Oldest First</option>
          <option value="reviewedAt-desc">Recently Reviewed</option>
        </select>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            showAdvanced
              ? 'border-gold text-gold bg-gold/5'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="h-5 w-5" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-gold" />
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-wrap gap-4">
            {/* Date Range */}
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-gold"
                placeholder="Start Date"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold focus:border-gold"
                placeholder="End Date"
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
