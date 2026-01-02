'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { getBrandBySlug } from '@/lib/api/brands.api';
import { getProductsByBrand } from '@/lib/api/products.api';
import { ProductCard, ProductCardSkeleton } from '@/components/product';
import { formatCurrency, resolveImageUrl } from '@/lib/utils';
import { FallbackImage } from '@/components/ui/FallbackImage';

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'newest';

export default function BrandPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const limit = 12;

  // Fetch brand
  const {
    data: brand,
    isLoading: brandLoading,
    error: brandError,
  } = useQuery({
    queryKey: ['brand', slug],
    queryFn: () => getBrandBySlug(slug),
    enabled: !!slug,
  });

  // Fetch products
  const {
    data: productsData,
    isLoading: productsLoading,
  } = useQuery({
    queryKey: ['products', 'brand', slug, page, limit],
    queryFn: () => getProductsByBrand(slug, { page, limit }),
    enabled: !!slug,
  });

  // Get sort params
  const getSortParams = (sort: SortOption) => {
    switch (sort) {
      case 'name-asc':
        return { sortBy: 'name' as const, sortOrder: 'asc' as const };
      case 'name-desc':
        return { sortBy: 'name' as const, sortOrder: 'desc' as const };
      case 'price-asc':
        return { sortBy: 'price' as const, sortOrder: 'asc' as const };
      case 'price-desc':
        return { sortBy: 'price' as const, sortOrder: 'desc' as const };
      case 'newest':
      default:
        return { sortBy: 'createdAt' as const, sortOrder: 'desc' as const };
    }
  };

  // Filter and sort products client-side
  const filteredProducts = useMemo(() => {
    let products = productsData?.data || [];

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    const { sortBy: sortField, sortOrder } = getSortParams(sortBy);
    products = [...products].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'price') {
        // Handle null prices - put them at the end
        const priceA = a.price ?? Number.MAX_VALUE;
        const priceB = b.price ?? Number.MAX_VALUE;
        comparison = priceA - priceB;
      } else if (sortField === 'createdAt') {
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return products;
  }, [productsData?.data, search, sortBy]);

  const pagination = productsData?.pagination;
  const totalPages = pagination?.pages || 1;

  // Handle 404
  if (brandError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Brand Not Found</h1>
          <p className="text-gray-600 mb-8">
            The brand you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/brands"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-secondary-900 font-semibold rounded-lg transition-colors"
          >
            Browse All Brands
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Brand Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-12">
          {brandLoading ? (
            <div className="flex flex-col md:flex-row items-center gap-8 animate-pulse">
              <div className="w-32 h-32 bg-gray-200 rounded-xl" />
              <div className="flex-1 text-center md:text-left">
                <div className="h-8 bg-gray-200 rounded w-48 mb-4 mx-auto md:mx-0" />
                <div className="h-4 bg-gray-100 rounded w-full max-w-xl mb-2" />
                <div className="h-4 bg-gray-100 rounded w-3/4 max-w-lg" />
              </div>
            </div>
          ) : brand ? (
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Brand Logo */}
              <div className="relative w-32 h-32 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                <FallbackImage
                  src={resolveImageUrl(brand.logo) || '/images/placeholder-brand.svg'}
                  alt={brand.name}
                  fill
                  type="brand"
                  className="object-contain p-4"
                  sizes="128px"
                />
              </div>

              {/* Brand Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-secondary-800 mb-2">
                  {brand.name}
                </h1>
                {brand.description && (
                  <p className="text-gray-600 max-w-2xl mb-4">{brand.description}</p>
                )}

                {/* Minimum Order Badge */}
                {brand.minimumOrderAmount > 0 && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 border border-amber-200 rounded-lg">
                    <svg
                      className="w-5 h-5 text-amber-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-amber-800 font-medium">
                      Minimum Order: {formatCurrency(brand.minimumOrderAmount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Product Count */}
              <div className="text-center md:text-right">
                <p className="text-3xl font-bold text-primary-500">
                  {pagination?.total || 0}
                </p>
                <p className="text-gray-500">Products</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <h2 className="text-2xl font-bold text-secondary-800">
              {brand?.name} Products
            </h2>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="name-desc">Name: Z-A</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>

              {/* Filter Toggle (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg bg-white"
              >
                <FunnelIcon className="w-5 h-5" />
                Filters
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {search ? 'No products found' : `No products available from ${brand?.name}`}
              </h3>
              <p className="text-gray-600 mb-6">
                {search
                  ? 'Try adjusting your search terms'
                  : 'Check back later for new products'}
              </p>
              {search ? (
                <button
                  onClick={() => setSearch('')}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Clear Search
                </button>
              ) : (
                <Link
                  href="/brands"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-secondary-900 font-semibold rounded-lg transition-colors"
                >
                  Browse All Brands
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} showBrand={false} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          page === pageNum
                            ? 'bg-primary-500 text-secondary-900'
                            : 'border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
