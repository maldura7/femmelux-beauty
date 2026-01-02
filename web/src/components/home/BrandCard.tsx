'use client';

import Link from 'next/link';
import type { Brand } from '@/types';
import { formatCurrency, resolveImageUrl } from '@/lib/utils';
import { FallbackImage } from '@/components/ui';

interface BrandCardProps {
  brand: Brand;
}

export function BrandCard({ brand }: BrandCardProps) {
  const productCount = brand.productCount || 0;

  return (
    <Link
      href={`/brands/${brand.slug}`}
      className="group block bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1"
    >
      {/* Logo Container */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6 overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent-500/10 rounded-full blur-2xl" />
        </div>

        {/* Logo */}
        <div className="relative w-full h-full flex items-center justify-center">
          <FallbackImage
            src={resolveImageUrl(brand.logo) || '/images/placeholder-brand.svg'}
            alt={brand.name}
            fill
            type="brand"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </div>

        {/* Minimum Order Badge */}
        {brand.minimumOrderAmount > 0 && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-secondary-800/90 text-white text-xs font-medium rounded">
            Min {formatCurrency(brand.minimumOrderAmount)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-secondary-800 group-hover:text-primary-600 transition-colors mb-1 truncate">
          {brand.name}
        </h3>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {productCount} {productCount === 1 ? 'Product' : 'Products'}
          </p>

          <span className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-sm font-medium">
            Shop
            <svg
              className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

// Skeleton for loading state
export function BrandCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      {/* Logo Container Skeleton */}
      <div className="aspect-[4/3] bg-gray-100" />

      {/* Content Skeleton */}
      <div className="p-4">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}
