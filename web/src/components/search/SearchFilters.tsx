'use client';

import React, { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface Brand {
  id: string;
  name: string;
  count?: number;
}

interface Category {
  id: string;
  name: string;
  count?: number;
  children?: Category[];
}

interface SearchFiltersProps {
  brands: Brand[];
  categories: Category[];
  selectedBrands: string[];
  selectedCategories: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  onBrandChange: (brandId: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onPriceChange: (min?: number, max?: number) => void;
  onInStockChange: (inStock: boolean) => void;
  onClearAll: () => void;
  activeFilterCount: number;
  className?: string;
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: number;
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
  badge,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-medium text-gray-900 flex items-center gap-2">
          {title}
          {badge !== undefined && badge > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 text-xs font-medium bg-pink-100 text-pink-700 rounded-full">
              {badge}
            </span>
          )}
        </span>
        {isOpen ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function SearchFilters({
  brands,
  categories,
  selectedBrands,
  selectedCategories,
  minPrice,
  maxPrice,
  inStock,
  onBrandChange,
  onCategoryChange,
  onPriceChange,
  onInStockChange,
  onClearAll,
  activeFilterCount,
  className = '',
}: SearchFiltersProps) {
  const [priceMin, setPriceMin] = useState<string>(minPrice?.toString() || '');
  const [priceMax, setPriceMax] = useState<string>(maxPrice?.toString() || '');
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const displayedBrands = showAllBrands ? brands : brands.slice(0, 10);
  const displayedCategories = showAllCategories ? categories : categories.slice(0, 10);

  const handlePriceApply = () => {
    const min = priceMin ? parseFloat(priceMin) : undefined;
    const max = priceMax ? parseFloat(priceMax) : undefined;
    onPriceChange(min, max);
  };

  const handlePriceClear = () => {
    setPriceMin('');
    setPriceMax('');
    onPriceChange(undefined, undefined);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <span className="font-semibold text-gray-900">Filters</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 text-xs font-medium bg-pink-600 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={onClearAll}
            className="text-sm text-pink-600 hover:text-pink-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="px-4">
        {/* Brands Filter */}
        <FilterSection
          title="Brands"
          badge={selectedBrands.length}
        >
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {displayedBrands.map((brand) => (
              <label
                key={brand.id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand.id)}
                  onChange={() => onBrandChange(brand.id)}
                  className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
                <span className="flex-1 text-sm text-gray-700 group-hover:text-gray-900">
                  {brand.name}
                </span>
                {brand.count !== undefined && (
                  <span className="text-xs text-gray-400">({brand.count})</span>
                )}
              </label>
            ))}
          </div>
          {brands.length > 10 && (
            <button
              onClick={() => setShowAllBrands(!showAllBrands)}
              className="mt-2 text-sm text-pink-600 hover:text-pink-700 font-medium"
            >
              {showAllBrands ? 'Show Less' : `Show All (${brands.length})`}
            </button>
          )}
        </FilterSection>

        {/* Categories Filter */}
        <FilterSection
          title="Categories"
          badge={selectedCategories.length}
        >
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {displayedCategories.map((category) => (
              <div key={category.id}>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => onCategoryChange(category.id)}
                    className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span className="flex-1 text-sm text-gray-700 group-hover:text-gray-900">
                    {category.name}
                  </span>
                  {category.count !== undefined && (
                    <span className="text-xs text-gray-400">({category.count})</span>
                  )}
                </label>
                {/* Subcategories */}
                {category.children && category.children.length > 0 && (
                  <div className="ml-6 mt-2 space-y-2">
                    {category.children.map((child) => (
                      <label
                        key={child.id}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(child.id)}
                          onChange={() => onCategoryChange(child.id)}
                          className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                        />
                        <span className="flex-1 text-sm text-gray-600 group-hover:text-gray-900">
                          {child.name}
                        </span>
                        {child.count !== undefined && (
                          <span className="text-xs text-gray-400">({child.count})</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {categories.length > 10 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="mt-2 text-sm text-pink-600 hover:text-pink-700 font-medium"
            >
              {showAllCategories ? 'Show Less' : `Show All (${categories.length})`}
            </button>
          )}
        </FilterSection>

        {/* Price Range Filter */}
        <FilterSection
          title="Price Range"
          badge={minPrice !== undefined || maxPrice !== undefined ? 1 : undefined}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Min"
                  min="0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                />
              </div>
              <span className="text-gray-400">-</span>
              <div className="flex-1">
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Max"
                  min="0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePriceApply}
                className="flex-1 px-3 py-2 text-sm font-medium bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                Apply
              </button>
              {(priceMin || priceMax) && (
                <button
                  onClick={handlePriceClear}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </FilterSection>

        {/* Availability Filter */}
        <FilterSection title="Availability" badge={inStock ? 1 : undefined}>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => onInStockChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">
              In Stock Only
            </span>
          </label>
        </FilterSection>
      </div>
    </div>
  );
}

export default SearchFilters;
