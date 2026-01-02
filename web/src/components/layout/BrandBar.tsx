'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { getBrands } from '@/lib/api/brands.api';
import { resolveImageUrl } from '@/lib/utils';
import { FallbackImage } from '@/components/ui/FallbackImage';
import type { Brand } from '@/types';

export function BrandBar() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: brandsData, isLoading } = useQuery({
    queryKey: ['brands', 'active'],
    queryFn: () => getBrands({ limit: 20, isActive: true }),
  });

  const brands = brandsData?.data || [];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const newScrollLeft =
        direction === 'left'
          ? scrollContainerRef.current.scrollLeft - scrollAmount
          : scrollContainerRef.current.scrollLeft + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
              Shop by Brand:
            </span>
            <div className="flex gap-4 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!brands.length) {
    return null;
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 py-2">
          {/* Label */}
          <span className="hidden sm:block text-sm font-medium text-gray-600 whitespace-nowrap">
            Shop by Brand:
          </span>

          {/* Scroll Left Button */}
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-primary-500 hover:text-primary-500 transition-colors flex-shrink-0"
            aria-label="Scroll left"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          {/* Brands Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex items-center gap-4 py-1">
              {brands.map((brand: Brand) => (
                <Link
                  key={brand.id}
                  href={`/brands/${brand.slug}` as '/'}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200 hover:border-primary-500 hover:shadow-sm transition-all whitespace-nowrap group flex-shrink-0"
                >
                  <div className="relative w-6 h-6 rounded-full overflow-hidden">
                    <FallbackImage
                      src={resolveImageUrl(brand.logo) || '/images/placeholder-brand.svg'}
                      alt={brand.name}
                      fill
                      type="brand"
                      className="object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors">
                    {brand.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-primary-500 hover:text-primary-500 transition-colors flex-shrink-0"
            aria-label="Scroll right"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hide scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default BrandBar;
