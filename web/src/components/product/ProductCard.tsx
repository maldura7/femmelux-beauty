'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBagIcon, CheckIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import type { Product } from '@/types';
import { formatCurrency, resolveImageUrl } from '@/lib/utils';
import { useCartStore } from '@/store/cart.store';
import { FallbackImage } from '@/components/ui';
import toast from 'react-hot-toast';
import { User, canSeePrices, isPending, isRejected, canPlaceOrders, isGuest, isSuspended } from '@/lib/auth';

interface ProductCardProps {
  product: Product;
  user?: User | null;
  onAddToCart?: (product: Product, quantity: number) => void;
  showBrand?: boolean;
}

export function ProductCard({ product, user, onAddToCart, showBrand = true }: ProductCardProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const addToCart = useCartStore((state) => state.addToCart);
  const isInCart = useCartStore((state) => state.isInCart(product.id));

  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];

  // Check if prices are available (null means hidden from this user)
  const pricesAvailable = product.price !== null;
  const hasDiscount = pricesAvailable && product.compareAtPrice && product.compareAtPrice > product.price!;
  const discountPercentage = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price!) / product.compareAtPrice!) * 100)
    : 0;
  const savings = hasDiscount ? product.compareAtPrice! - product.price! : 0;

  // Check if user can see prices and place orders
  // Use both: API returns null prices OR user object check
  const userCanSeePrices = pricesAvailable || canSeePrices(user);
  const userCanOrder = pricesAvailable && canPlaceOrders(user);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user can place orders
    if (!userCanOrder) {
      if (!user) {
        toast.error('Please login to add items to cart');
      } else if (isPending(user)) {
        toast.error('Your account is pending approval');
      } else if (isRejected(user)) {
        toast.error('Please reapply for an account');
      } else {
        toast.error('Please complete your business application');
      }
      return;
    }

    if (product.stock <= 0) {
      toast.error('This product is out of stock');
      return;
    }

    setIsAdding(true);
    try {
      if (onAddToCart) {
        onAddToCart(product, product.minOrderQuantity || 1);
      } else {
        addToCart(product, product.minOrderQuantity || 1);
      }
      toast.success(`Added ${product.name} to cart`);
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1">
      {/* Image Container */}
      <Link
        href={`/products/${product.slug}`}
        className="block relative aspect-square overflow-hidden bg-gray-50"
      >
        <FallbackImage
          src={primaryImage ? resolveImageUrl(primaryImage.url) || '/images/placeholder-product.svg' : '/images/placeholder-product.svg'}
          alt={primaryImage?.alt || product.name}
          fill
          type="product"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {hasDiscount && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
              -{discountPercentage}%
            </span>
          )}
          {product.isFeatured && (
            <span className="px-2 py-1 bg-primary-500 text-secondary-900 text-xs font-semibold rounded">
              Featured
            </span>
          )}
          {product.stock <= 0 && (
            <span className="px-2 py-1 bg-gray-800 text-white text-xs font-semibold rounded">
              Out of Stock
            </span>
          )}
          {product.stock > 0 && product.stock <= product.lowStockThreshold && (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded">
              Low Stock
            </span>
          )}
        </div>

        {/* Quick Add Button - Shows on Hover (only for users who can order) */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          {userCanOrder ? (
            <button
              onClick={handleAddToCart}
              disabled={isAdding || product.stock <= 0}
              className={`w-full py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                product.stock <= 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : isInCart
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-secondary-800 text-white hover:bg-secondary-900'
              }`}
            >
              {isAdding ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                  Adding...
                </>
              ) : product.stock <= 0 ? (
                'Out of Stock'
              ) : isInCart ? (
                <>
                  <CheckIcon className="w-4 h-4" />
                  In Cart
                </>
              ) : (
                <>
                  <ShoppingBagIcon className="w-4 h-4" />
                  Add to Cart
                </>
              )}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(!user ? '/login' : '/account/apply');
              }}
              className="w-full py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 bg-primary-500 text-secondary-900 hover:bg-primary-600"
            >
              <LockClosedIcon className="w-4 h-4" />
              {!user ? 'Login to Order' : isPending(user) ? 'Pending Approval' : 'Apply to Order'}
            </button>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Brand */}
        {showBrand && (
          <Link
            href={`/brands/${product.brand.slug}`}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 uppercase tracking-wide"
          >
            {product.brand.name}
          </Link>
        )}

        {/* Product Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-1 font-medium text-secondary-800 hover:text-primary-600 transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* SKU */}
        <p className="mt-1 text-xs text-gray-400">SKU: {product.sku}</p>

        {/* Price */}
        <div className="mt-3 space-y-1">
          {pricesAvailable ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary-600">
                  {formatCurrency(product.price!)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatCurrency(product.compareAtPrice!)}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <p className="text-xs text-green-600 font-medium">
                  Save {formatCurrency(savings)}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <LockClosedIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">
                {!user ? (
                  <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                    Login for prices
                  </Link>
                ) : isPending(user) ? (
                  <span className="text-yellow-600">Pending approval</span>
                ) : isRejected(user) ? (
                  <Link href="/account/apply" className="text-red-600 hover:text-red-700 font-medium">
                    Reapply for access
                  </Link>
                ) : isGuest(user) ? (
                  <Link href="/account/apply" className="text-primary-600 hover:text-primary-700 font-medium">
                    Apply for prices
                  </Link>
                ) : isSuspended(user) ? (
                  <span className="text-gray-500">Account suspended</span>
                ) : (
                  <span className="text-gray-500">Price unavailable</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Stock Status */}
        <div className="mt-2 flex items-center gap-1">
          <span
            className={`w-2 h-2 rounded-full ${
              product.stock > product.lowStockThreshold
                ? 'bg-green-500'
                : product.stock > 0
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-gray-500">
            {product.stock > product.lowStockThreshold
              ? 'In Stock'
              : product.stock > 0
              ? `Only ${product.stock} left`
              : 'Out of Stock'}
          </span>
        </div>

        {/* Minimum Order */}
        {product.minOrderQuantity > 1 && (
          <p className="mt-2 text-xs text-gray-500">
            Min. order: {product.minOrderQuantity} units
          </p>
        )}
      </div>
    </div>
  );
}

// Skeleton for loading state
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square bg-gray-200" />

      {/* Content Skeleton */}
      <div className="p-4">
        <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-full mb-1" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-1/4 mb-3" />
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  );
}
