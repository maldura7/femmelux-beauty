'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getBrands } from '@/lib/api/brands.api';
import { getFeaturedProducts } from '@/lib/api/products.api';
import {
  HeroBanner,
  BrandCard,
  BrandCardSkeleton,
  FeatureCard,
  FeatureIcons,
  ProductCard,
  ProductCardSkeleton,
  Newsletter,
} from '@/components/home';

export default function HomePage() {
  // Fetch brands
  const {
    data: brandsData,
    isLoading: brandsLoading,
    error: brandsError,
  } = useQuery({
    queryKey: ['brands', 'homepage'],
    queryFn: () => getBrands({ limit: 8, isActive: true }),
  });

  // Fetch featured products
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => getFeaturedProducts(8),
  });

  const brands = brandsData?.data || [];
  const products = productsData || [];

  return (
    <div className="min-h-screen">
      {/* Section 1: Hero Banner */}
      <HeroBanner
        title="Premium Beauty for Professionals"
        subtitle="Wholesale pricing for salons, spas, and retailers. Access exclusive products from top beauty brands at competitive prices."
        ctaText="Shop Brands"
        ctaHref="/brands"
        backgroundImage="/images/hero-beauty.jpg"
      />

      {/* Section 2: Featured Brands */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full mb-4">
              Our Partners
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-800 mb-4">
              Shop by Brand
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover premium beauty brands with exclusive wholesale pricing.
              Each brand is carefully vetted to ensure quality and authenticity.
            </p>
          </div>

          {/* Brands Grid */}
          {brandsError ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Failed to load brands. Please try again later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {brandsLoading
                ? Array.from({ length: 8 }).map((_, i) => <BrandCardSkeleton key={i} />)
                : brands.map((brand) => <BrandCard key={brand.id} brand={brand} />)}
            </div>
          )}

          {/* View All Button */}
          {!brandsLoading && brands.length > 0 && (
            <div className="text-center mt-12">
              <Link
                href="/brands"
                className="inline-flex items-center gap-2 px-8 py-4 bg-secondary-800 hover:bg-secondary-900 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                View All Brands
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Section 3: Why Choose FemmeLux */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full mb-4">
              Why Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-800 mb-4">
              Why Choose FemmeLux?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide everything you need to grow your beauty business
              with premium products at wholesale prices.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              icon={FeatureIcons.Tag}
              title="Wholesale Pricing"
              description="Access exclusive wholesale prices with tiered discounts. The more you order, the more you save on premium beauty products."
            />
            <FeatureCard
              icon={FeatureIcons.Star}
              title="Premium Brands"
              description="Partner with carefully vetted, authentic brands. We ensure every product meets our quality standards."
            />
            <FeatureCard
              icon={FeatureIcons.Truck}
              title="Fast Shipping"
              description="Quick and reliable shipping across the region. Track your orders in real-time from warehouse to your door."
            />
          </div>

          {/* Additional Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-8">
            <FeatureCard
              icon={FeatureIcons.Shield}
              title="Secure Payments"
              description="Your transactions are protected with industry-standard encryption and multiple secure payment options."
            />
            <FeatureCard
              icon={FeatureIcons.Clock}
              title="Easy Reordering"
              description="Save time with quick reorder features. Access your order history and repeat purchases with one click."
            />
            <FeatureCard
              icon={FeatureIcons.Support}
              title="Dedicated Support"
              description="Our wholesale specialists are here to help. Get personalized assistance for all your ordering needs."
            />
          </div>
        </div>
      </section>

      {/* Section 4: Featured Products */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full mb-4">
              Best Sellers
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-800 mb-4">
              Featured Products
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our most popular products loved by salons and spas worldwide.
              Quality beauty products at unbeatable wholesale prices.
            </p>
          </div>

          {/* Products Grid */}
          {productsError ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Failed to load products. Please try again later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {productsLoading
                ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}

          {/* View All Button */}
          {!productsLoading && products.length > 0 && (
            <div className="text-center mt-12">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-4 bg-secondary-800 hover:bg-secondary-900 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Shop All Products
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Section 5: Newsletter Signup */}
      <Newsletter />

      {/* Section 6: CTA Banner */}
      <section className="py-16 lg:py-20 bg-secondary-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Grow Your Business?
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of salons, spas, and retailers who trust FemmeLux
              for their wholesale beauty needs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 hover:bg-primary-600 text-secondary-900 font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Apply for Wholesale Account
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border-2 border-white/30 hover:border-white/50 text-white font-semibold rounded-lg transition-all duration-300 hover:bg-white/5"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
