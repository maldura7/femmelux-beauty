'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getBrands, Brand } from '@/lib/api/brands.api';
import { resolveImageUrl, formatCurrency } from '@/lib/utils';
import { FallbackImage } from '@/components/ui/FallbackImage';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await getBrands({ limit: 100 });
        setBrands(response.data);
        setFilteredBrands(response.data);
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrands();
  }, []);

  // Filter brands based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBrands(brands);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredBrands(
        brands.filter(
          (brand) =>
            brand.name.toLowerCase().includes(query) ||
            brand.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, brands]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Our Brands</h1>
          <p className="text-lg text-pink-100 max-w-2xl">
            Discover our curated collection of premium beauty brands. We partner with
            the best in the industry to bring you high-quality products at wholesale prices.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
            />
          </div>
        </div>

        {/* Brands Count */}
        <div className="mb-8 text-center">
          <p className="text-gray-600">
            {filteredBrands.length} brand{filteredBrands.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Brands Grid */}
        {filteredBrands.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">No brands found matching your search.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-pink-600 hover:text-pink-700 font-medium"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBrands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.slug}` as '/'}
                className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Brand Logo */}
                <div className="relative h-48 bg-gray-50 flex items-center justify-center">
                  <FallbackImage
                    src={resolveImageUrl(brand.logo) || '/images/placeholder-brand.svg'}
                    alt={brand.name}
                    fill
                    type="brand"
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Brand Info */}
                <div className="p-5">
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-pink-600 transition-colors mb-2">
                    {brand.name}
                  </h2>

                  {brand.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {brand.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {brand.productCount || 0} product{(brand.productCount || 0) !== 1 ? 's' : ''}
                    </span>
                    {brand.minimumOrderAmount > 0 && (
                      <span className="text-pink-600 font-medium">
                        Min: {formatCurrency(brand.minimumOrderAmount)}
                      </span>
                    )}
                  </div>
                </div>

                {/* View Button */}
                <div className="px-5 pb-5">
                  <div className="w-full py-2.5 bg-gray-100 group-hover:bg-pink-600 text-gray-700 group-hover:text-white text-center rounded-lg font-medium transition-colors">
                    View Products
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
