'use client';

import React from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

interface NoResultsProps {
  query: string;
  suggestion?: string | null;
  popularSearches?: string[];
  popularCategories?: { name: string; slug: string }[];
  onSuggestionClick?: (suggestion: string) => void;
}

export function NoResults({
  query,
  suggestion,
  popularSearches = [],
  popularCategories = [],
  onSuggestionClick,
}: NoResultsProps) {
  return (
    <div className="text-center py-16 px-4">
      {/* Icon */}
      <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <MagnifyingGlassIcon className="h-10 w-10 text-gray-400" />
      </div>

      {/* Message */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        No results found for &quot;{query}&quot;
      </h2>
      <p className="text-gray-600 max-w-md mx-auto">
        We couldn&apos;t find any products matching your search. Try checking your spelling or using different keywords.
      </p>

      {/* Did You Mean */}
      {suggestion && (
        <div className="mt-6 p-4 bg-pink-50 rounded-lg inline-block">
          <p className="text-gray-700">
            Did you mean:{' '}
            <button
              onClick={() => onSuggestionClick?.(suggestion)}
              className="text-pink-600 font-semibold hover:text-pink-700 underline"
            >
              {suggestion}
            </button>
            ?
          </p>
        </div>
      )}

      {/* Search Tips */}
      <div className="mt-10 max-w-lg mx-auto text-left">
        <div className="flex items-center gap-2 mb-4">
          <LightBulbIcon className="h-5 w-5 text-yellow-500" />
          <h3 className="font-medium text-gray-900">Search Tips</h3>
        </div>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-pink-500 mt-1">•</span>
            <span>Check your spelling for typos</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pink-500 mt-1">•</span>
            <span>Try more general keywords (e.g., &quot;lipstick&quot; instead of &quot;matte red lipstick&quot;)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pink-500 mt-1">•</span>
            <span>Use fewer keywords to broaden your search</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pink-500 mt-1">•</span>
            <span>Try searching by brand name or product category</span>
          </li>
        </ul>
      </div>

      {/* Popular Searches */}
      {popularSearches.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ArrowTrendingUpIcon className="h-5 w-5 text-gray-500" />
            <h3 className="font-medium text-gray-900">Popular Searches</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {popularSearches.map((search) => (
              <button
                key={search}
                onClick={() => onSuggestionClick?.(search)}
                className="px-4 py-2 bg-gray-100 hover:bg-pink-100 text-gray-700 hover:text-pink-700 rounded-full text-sm transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Categories */}
      {popularCategories.length > 0 && (
        <div className="mt-10">
          <h3 className="font-medium text-gray-900 mb-4">Browse Popular Categories</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {popularCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}` as any}
                className="px-5 py-2.5 border border-gray-300 hover:border-pink-500 hover:bg-pink-50 text-gray-700 hover:text-pink-700 rounded-lg text-sm font-medium transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Browse All */}
      <div className="mt-10">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors"
        >
          Browse All Products
        </Link>
      </div>
    </div>
  );
}

export default NoResults;
