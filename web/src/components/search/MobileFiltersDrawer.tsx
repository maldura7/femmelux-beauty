'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { SearchFilters } from './SearchFilters';

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

interface MobileFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export function MobileFiltersDrawer({
  isOpen,
  onClose,
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
}: MobileFiltersDrawerProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 z-40 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5 text-gray-500" />
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Filters
                  </Dialog.Title>
                  {activeFilterCount > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 text-xs font-medium bg-pink-600 text-white rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md text-gray-400 hover:text-gray-500"
                  onClick={onClose}
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              {/* Filters */}
              <div className="flex-1 overflow-y-auto">
                <SearchFilters
                  brands={brands}
                  categories={categories}
                  selectedBrands={selectedBrands}
                  selectedCategories={selectedCategories}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  inStock={inStock}
                  onBrandChange={onBrandChange}
                  onCategoryChange={onCategoryChange}
                  onPriceChange={onPriceChange}
                  onInStockChange={onInStockChange}
                  onClearAll={onClearAll}
                  activeFilterCount={activeFilterCount}
                  className="border-0 shadow-none rounded-none"
                />
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-4 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full flex items-center justify-center px-4 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors"
                >
                  View Results
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export default MobileFiltersDrawer;
