'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CheckIcon,
  XMarkIcon,
  ShoppingBagIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { getProductBySlug, getRelatedProducts } from '@/lib/api/products.api';
import { ImageGallery, ImageGallerySkeleton, QuantitySelector, ProductCard, ProductCardSkeleton } from '@/components/product';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/store/cart.store';
import { useAuth } from '@/hooks/useAuth';
import { isApproved, isPending, isGuest, isRejected } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const relatedScrollRef = useRef<HTMLDivElement>(null);

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const addToCart = useCartStore((state) => state.addToCart);
  const isInCart = useCartStore((state) => state.isInCart);
  const { user, isAuthenticated } = useAuth();

  // Check if user can see prices
  const canSeePrices = isApproved(user) || user?.role === 'ADMIN' || user?.role === 'VENDOR';

  // Fetch product
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
  });

  // Fetch related products
  const { data: relatedProducts, isLoading: relatedLoading } = useQuery({
    queryKey: ['products', 'related', product?.id],
    queryFn: () => getRelatedProducts(product!.id, 6),
    enabled: !!product?.id,
  });

  // Initialize quantity to minOrderQuantity when product loads
  useState(() => {
    if (product?.minOrderQuantity) {
      setQuantity(product.minOrderQuantity);
    }
  });

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) return;

    setIsAdding(true);
    try {
      addToCart(product, quantity);
      toast.success(`Added ${quantity} x ${product.name} to cart`);
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const scrollRelated = (direction: 'left' | 'right') => {
    if (relatedScrollRef.current) {
      const scrollAmount = 300;
      relatedScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Handle 404
  if (productError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">
            The product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-secondary-900 font-semibold rounded-lg transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  // Calculations - handle null prices
  const hasDiscount = product?.price !== null && product?.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product!.compareAtPrice! - product!.price!) / product!.compareAtPrice!) * 100)
    : 0;
  const savings = hasDiscount ? product!.compareAtPrice! - product!.price! : 0;
  const productInCart = product ? isInCart(product.id) : false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-primary-600">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/products" className="text-gray-500 hover:text-primary-600">
              Products
            </Link>
            {product && (
              <>
                <span className="text-gray-400">/</span>
                <Link
                  href={`/brands/${product.brand.slug}` as '/'}
                  className="text-gray-500 hover:text-primary-600"
                >
                  {product.brand.name}
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-secondary-800 font-medium truncate max-w-[200px]">
                  {product.name}
                </span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {productLoading ? (
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery Skeleton */}
            <ImageGallerySkeleton />

            {/* Product Info Skeleton */}
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-100 rounded w-32 mb-6" />
              <div className="h-10 bg-gray-200 rounded w-40 mb-6" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-8" />
              <div className="h-14 bg-gray-200 rounded w-full" />
            </div>
          </div>
        ) : product ? (
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column: Image Gallery */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <ImageGallery images={product.images} productName={product.name} />
            </div>

            {/* Right Column: Product Info */}
            <div>
              {/* Brand Link */}
              <Link
                href={`/brands/${product.brand.slug}` as '/'}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 uppercase tracking-wide mb-2"
              >
                {product.brand.name}
              </Link>

              {/* Product Name */}
              <h1 className="text-2xl md:text-3xl font-bold text-secondary-800 mb-2">
                {product.name}
              </h1>

              {/* SKU */}
              <p className="text-sm text-gray-500 mb-6">SKU: {product.sku}</p>

              {/* Price Display */}
              <div className="mb-6">
                {product.price !== null ? (
                  <>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold text-primary-600">
                        {formatCurrency(product.price)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xl text-gray-400 line-through">
                          {formatCurrency(product.compareAtPrice!)}
                        </span>
                      )}
                    </div>
                    {hasDiscount && (
                      <div className="mt-2 flex items-center gap-3">
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded">
                          {discountPercentage}% OFF
                        </span>
                        <span className="text-green-600 font-medium">
                          You save {formatCurrency(savings)}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 text-gray-600 mb-2">
                      <LockClosedIcon className="w-5 h-5" />
                      <span className="font-medium">Wholesale Pricing</span>
                    </div>
                    {!isAuthenticated ? (
                      <p className="text-sm text-gray-500 mb-3">
                        Sign in or apply for a business account to see wholesale prices.
                      </p>
                    ) : isPending(user) ? (
                      <p className="text-sm text-gray-500 mb-3">
                        Your business application is pending approval. You&apos;ll see prices once approved.
                      </p>
                    ) : isGuest(user) ? (
                      <p className="text-sm text-gray-500 mb-3">
                        Apply for a business account to access wholesale pricing.
                      </p>
                    ) : isRejected(user) ? (
                      <p className="text-sm text-gray-500 mb-3">
                        Your application was not approved. You can reapply for a business account.
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 mb-3">
                        Contact support for access to wholesale pricing.
                      </p>
                    )}
                    <div className="flex gap-2">
                      {!isAuthenticated ? (
                        <>
                          <Link
                            href="/login"
                            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-secondary-900 text-sm font-semibold rounded-lg transition-colors"
                          >
                            Sign In
                          </Link>
                          <Link
                            href="/register"
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                          >
                            Apply for Account
                          </Link>
                        </>
                      ) : (isPending(user)) ? (
                        <Link
                          href="/account/application"
                          className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-sm font-medium rounded-lg transition-colors"
                        >
                          Check Application Status
                        </Link>
                      ) : (isGuest(user) || isRejected(user)) && (
                        <Link
                          href="/account/apply"
                          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-secondary-900 text-sm font-semibold rounded-lg transition-colors"
                        >
                          {isRejected(user) ? 'Reapply for Account' : 'Apply for Business Account'}
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-4 mb-6">
                {product.stock > 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckIcon className="w-5 h-5" />
                    <span className="font-medium">
                      {product.stock > product.lowStockThreshold
                        ? 'In Stock'
                        : `Only ${product.stock} left`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XMarkIcon className="w-5 h-5" />
                    <span className="font-medium">Out of Stock</span>
                  </div>
                )}
                {product.stock > 0 && product.stock <= product.lowStockThreshold && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                    Low Stock
                  </span>
                )}
              </div>

              {/* Category Badge */}
              {product.category && (
                <div className="mb-6">
                  <Link
                    href={`/categories/${product.category.slug}` as '/'}
                    className="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                  >
                    {product.category.name}
                  </Link>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-secondary-800 uppercase tracking-wide mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Add to Cart Section - Only show when prices are visible */}
              {product.price !== null && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  {product.stock > 0 ? (
                    <>
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-4 mb-4">
                        <label className="text-sm font-medium text-gray-700">Quantity:</label>
                        <QuantitySelector
                          value={quantity}
                          onChange={setQuantity}
                          min={product.minOrderQuantity || 1}
                          max={Math.min(product.maxOrderQuantity || 999, product.stock)}
                          size="lg"
                        />
                      </div>

                      {/* Min/Max Order Info */}
                      {(product.minOrderQuantity > 1 || product.maxOrderQuantity) && (
                        <p className="text-xs text-gray-500 mb-4">
                          {product.minOrderQuantity > 1 && (
                            <span>Min: {product.minOrderQuantity} units</span>
                          )}
                          {product.minOrderQuantity > 1 && product.maxOrderQuantity && (
                            <span> &bull; </span>
                          )}
                          {product.maxOrderQuantity && (
                            <span>Max: {product.maxOrderQuantity} units</span>
                          )}
                        </p>
                      )}

                      {/* Subtotal */}
                      <div className="flex items-center justify-between mb-4 py-3 border-t border-gray-200">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="text-xl font-bold text-secondary-800">
                          {formatCurrency(product.price * quantity)}
                        </span>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={handleAddToCart}
                        disabled={isAdding}
                        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                          productInCart
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-primary-500 hover:bg-primary-600 text-secondary-900'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isAdding ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Adding to Cart...
                          </>
                        ) : productInCart ? (
                          <>
                            <CheckIcon className="w-5 h-5" />
                            Add More to Cart
                          </>
                        ) : (
                          <>
                            <ShoppingBagIcon className="w-5 h-5" />
                            Add to Cart
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">This product is currently out of stock.</p>
                      <Link
                        href={`/brands/${product.brand.slug}` as '/'}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Browse more from {product.brand.name}
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Minimum Order Notice */}
              {product.brand.minimumOrderAmount > 0 && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                  <svg
                    className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
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
                  <div>
                    <p className="text-amber-800 font-medium">Minimum Order Required</p>
                    <p className="text-amber-700 text-sm">
                      {product.brand.name} requires a minimum order of{' '}
                      {formatCurrency(product.brand.minimumOrderAmount)}.
                    </p>
                  </div>
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <TruckIcon className="w-6 h-6 text-primary-500" />
                  <div>
                    <p className="text-sm font-medium text-secondary-800">Fast Shipping</p>
                    <p className="text-xs text-gray-500">2-5 business days</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <ShieldCheckIcon className="w-6 h-6 text-primary-500" />
                  <div>
                    <p className="text-sm font-medium text-secondary-800">Authentic Products</p>
                    <p className="text-xs text-gray-500">100% genuine</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Related Products */}
        {product && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-secondary-800">
                More from {product.brand.name}
              </h2>
              {relatedProducts && relatedProducts.length > 4 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollRelated('left')}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => scrollRelated('right')}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {relatedLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : relatedProducts && relatedProducts.length > 0 ? (
              <div
                ref={relatedScrollRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
              >
                {relatedProducts.map((relatedProduct) => (
                  <div
                    key={relatedProduct.id}
                    className="flex-shrink-0 w-[calc(50%-8px)] md:w-[calc(25%-12px)] lg:w-[calc(16.666%-14px)] snap-start"
                  >
                    <ProductCard product={relatedProduct} showBrand={false} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No other products available from this brand.
              </p>
            )}

            {/* View All Brand Products */}
            <div className="text-center mt-8">
              <Link
                href={`/brands/${product.brand.slug}` as '/'}
                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary-800 hover:bg-secondary-900 text-white font-semibold rounded-lg transition-colors"
              >
                View All {product.brand.name} Products
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
          </section>
        )}
      </div>
    </div>
  );
}
