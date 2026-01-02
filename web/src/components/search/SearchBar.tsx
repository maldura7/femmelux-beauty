'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import {
  getSearchSuggestions,
  getPopularSearches,
  Suggestions,
  PopularSearch,
} from '@/lib/api/search.api';
import { HighlightedText } from './HighlightedText';
import { formatPrice } from '@/lib/utils';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  autoFocus?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SearchBar({
  className = '',
  placeholder = 'Search products, brands...',
  onSearch,
  autoFocus = false,
  size = 'md',
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Hooks
  const debouncedQuery = useDebounce(query, 300);
  const { history, addToHistory, clearHistory } = useSearchHistory();

  // Size classes
  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base',
    lg: 'h-14 text-lg',
  };

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 2) {
        setSuggestions(null);
        return;
      }

      setIsLoading(true);
      try {
        const data = await getSearchSuggestions(debouncedQuery);
        setSuggestions(data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Fetch popular searches on mount
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const data = await getPopularSearches(8);
        setPopularSearches(data);
      } catch (error) {
        console.error('Error fetching popular searches:', error);
      }
    };

    fetchPopular();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate all selectable items for keyboard navigation
  const getSelectableItems = useCallback(() => {
    const items: { type: string; value: string; data?: unknown }[] = [];

    // Search history
    if (!query && history.length > 0) {
      history.slice(0, 5).forEach((h) => {
        items.push({ type: 'history', value: h });
      });
    }

    // Suggestions
    if (suggestions) {
      suggestions.products.forEach((p) => {
        items.push({ type: 'product', value: p.name, data: p });
      });
      suggestions.brands.forEach((b) => {
        items.push({ type: 'brand', value: b.name, data: b });
      });
      suggestions.categories.forEach((c) => {
        items.push({ type: 'category', value: c.name, data: c });
      });
    }

    // Popular searches (when no query)
    if (!query && popularSearches.length > 0) {
      popularSearches.forEach((p) => {
        items.push({ type: 'popular', value: p.query });
      });
    }

    return items;
  }, [query, history, suggestions, popularSearches]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = getSelectableItems();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          const item = items[selectedIndex];
          handleSelect(item.type, item.value, item.data);
        } else {
          handleSubmit();
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle selection of an item
  const handleSelect = (
    type: string,
    value: string,
    data?: unknown
  ) => {
    setIsOpen(false);
    setSelectedIndex(-1);

    switch (type) {
      case 'history':
      case 'popular':
        setQuery(value);
        addToHistory(value);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(`/search?q=${encodeURIComponent(value)}` as any);
        break;

      case 'product':
        const product = data as { slug: string };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(`/products/${product.slug}` as any);
        break;

      case 'brand':
        const brand = data as { slug: string };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(`/brands/${brand.slug}` as any);
        break;

      case 'category':
        const category = data as { slug: string };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(`/categories/${category.slug}` as any);
        break;
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    addToHistory(trimmedQuery);
    setIsOpen(false);

    if (onSearch) {
      onSearch(trimmedQuery);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}` as any);
    }
  };

  // Clear input
  const handleClear = () => {
    setQuery('');
    setSuggestions(null);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Check if dropdown should be shown
  const showDropdown = isOpen && (
    query.length > 0 ||
    history.length > 0 ||
    popularSearches.length > 0
  );

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`
            w-full pl-11 pr-10 rounded-lg border border-gray-300
            focus:border-pink-500 focus:ring-2 focus:ring-pink-200
            transition-all duration-200 outline-none
            ${sizeClasses[size]}
          `}
        />

        {/* Search Icon */}
        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />

        {/* Loading / Clear Button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <div className="h-4 w-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          )}
          {query && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[70vh] overflow-y-auto z-50"
        >
          {/* Search History */}
          {!query && history.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Recent Searches
                </span>
                <button
                  onClick={clearHistory}
                  className="text-xs text-pink-600 hover:text-pink-700"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-1">
                {history.slice(0, 5).map((item, index) => (
                  <button
                    key={item}
                    onClick={() => handleSelect('history', item)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-md text-left
                      transition-colors
                      ${selectedIndex === index
                        ? 'bg-pink-50 text-pink-700'
                        : 'hover:bg-gray-50 text-gray-700'
                      }
                    `}
                  >
                    <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Suggestions */}
          {suggestions && suggestions.products.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                Products
              </span>
              <div className="space-y-1">
                {suggestions.products.map((product, idx) => {
                  const itemIndex = (history.length > 0 && !query ? Math.min(history.length, 5) : 0) + idx;
                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-md
                        transition-colors
                        ${selectedIndex === itemIndex
                          ? 'bg-pink-50'
                          : 'hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="relative h-10 w-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <HighlightedText
                          text={product.name}
                          highlight={query}
                          className="block text-sm font-medium text-gray-900 truncate"
                        />
                        {product.brand && (
                          <span className="text-xs text-gray-500">{product.brand.name}</span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-pink-600">
                        {formatPrice(product.wholesalePrice)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Brand Suggestions */}
          {suggestions && suggestions.brands.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                In Brands
              </span>
              <div className="flex flex-wrap gap-2">
                {suggestions.brands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/brands/${brand.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 hover:bg-pink-100 text-sm text-gray-700 hover:text-pink-700 transition-colors"
                  >
                    <HighlightedText text={brand.name} highlight={query} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Category Suggestions */}
          {suggestions && suggestions.categories.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                In Categories
              </span>
              <div className="flex flex-wrap gap-2">
                {suggestions.categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}` as any}
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 hover:bg-pink-100 text-sm text-gray-700 hover:text-pink-700 transition-colors"
                  >
                    <HighlightedText text={category.name} highlight={query} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          {!query && popularSearches.length > 0 && (
            <div className="p-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                Popular Searches
              </span>
              <div className="space-y-1">
                {popularSearches.map((item, index) => {
                  const itemIndex = (history.length > 0 ? Math.min(history.length, 5) : 0) + index;
                  return (
                    <button
                      key={item.query}
                      onClick={() => handleSelect('popular', item.query)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-md text-left
                        transition-colors
                        ${selectedIndex === itemIndex
                          ? 'bg-pink-50 text-pink-700'
                          : 'hover:bg-gray-50 text-gray-700'
                        }
                      `}
                    >
                      <ArrowTrendingUpIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{item.query}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* See All Results Button */}
          {query && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                <span>
                  Search for &quot;{query}&quot;
                  {suggestions && suggestions.products.length > 0 && (
                    <span className="ml-1 text-pink-200">
                      ({suggestions.products.length}+ results)
                    </span>
                  )}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
