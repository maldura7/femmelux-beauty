'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { Product } from '@/lib/api/products.api';
import { HighlightedText } from './HighlightedText';
import { formatPrice, resolveImageUrl } from '@/lib/utils';

interface SearchResultCardProps {
  product: Product;
  searchQuery?: string;
  view?: 'grid' | 'list';
  onAddToCart?: (product: Product) => void;
}

export function SearchResultCard({
  product,
  searchQuery = '',
  view = 'grid',
  onAddToCart,
}: SearchResultCardProps) {
  const primaryImageUrl = product.images.find((img) => img.isPrimary)?.url || product.images[0]?.url;
  const primaryImage = resolveImageUrl(primaryImageUrl);
  const isInStock = product.stock > 0;
  const pricesAvailable = product.price !== null;

  if (view === 'list') {
    return (
      <div className="flex gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
        {/* Image */}
        <Link
          href={`/products/${product.slug}` as '/'}
          className="relative w-32 h-32 flex-shrink-0 rounded-md overflow-hidden bg-gray-100"
        >
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-xs">No image</span>
            </div>
          )}
          {/* Stock Badge */}
          <div className="absolute top-2 left-2">
            {isInStock ? (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                In Stock
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                Out of Stock
              </span>
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1">
            <Link href={`/brands/${product.brand.slug}` as '/'}>
              <span className="text-xs text-pink-600 hover:text-pink-700 font-medium uppercase tracking-wide">
                {product.brand.name}
              </span>
            </Link>
            <Link href={`/products/${product.slug}` as '/'}>
              <h3 className="mt-1 text-lg font-medium text-gray-900 hover:text-pink-600 transition-colors line-clamp-2">
                <HighlightedText text={product.name} highlight={searchQuery} />
              </h3>
            </Link>
            {product.description && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                <HighlightedText text={product.description} highlight={searchQuery} />
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400">SKU: {product.sku}</p>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {pricesAvailable ? (
                <>
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(product.price!)}
                  </span>
                  {product.compareAtPrice && product.compareAtPrice > product.price! && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-gray-500">Login for prices</span>
              )}
            </div>

            <button
              onClick={() => onAddToCart?.(product)}
              disabled={!isInStock}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                transition-colors
                ${isInStock
                  ? 'bg-pink-600 text-white hover:bg-pink-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <ShoppingCartIcon className="h-4 w-4" />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      <Link
        href={`/products/${product.slug}` as '/'}
        className="relative aspect-square block overflow-hidden bg-gray-100"
      >
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}

        {/* Stock Badge */}
        <div className="absolute top-3 left-3">
          {isInStock ? (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full shadow-sm">
              In Stock
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full shadow-sm">
              Out of Stock
            </span>
          )}
        </div>

        {/* Discount Badge */}
        {pricesAvailable && product.compareAtPrice && product.compareAtPrice > product.price! && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-pink-600 text-white rounded-full shadow-sm">
              {Math.round((1 - product.price! / product.compareAtPrice) * 100)}% OFF
            </span>
          </div>
        )}

        {/* Quick Add Button (Hover) */}
        {isInStock && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onAddToCart?.(product);
            }}
            className="absolute bottom-3 left-3 right-3 py-2.5 bg-pink-600 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:bg-pink-700"
          >
            <span className="flex items-center justify-center gap-2">
              <ShoppingCartIcon className="h-4 w-4" />
              Add to Cart
            </span>
          </button>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/brands/${product.brand.slug}` as '/'}>
          <span className="text-xs text-pink-600 hover:text-pink-700 font-medium uppercase tracking-wide">
            {product.brand.name}
          </span>
        </Link>

        <Link href={`/products/${product.slug}` as '/'}>
          <h3 className="mt-1.5 text-sm font-medium text-gray-900 hover:text-pink-600 transition-colors line-clamp-2 min-h-[2.5rem]">
            <HighlightedText text={product.name} highlight={searchQuery} />
          </h3>
        </Link>

        <div className="mt-3 flex items-baseline gap-2">
          {pricesAvailable ? (
            <>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(product.price!)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price! && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-500">Login for prices</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchResultCard;
