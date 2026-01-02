'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBagIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
  useCartStore,
  useIsCartEmpty,
  useCartSubtotal,
  useCartItemCount,
  useMinimumOrderValidation,
  useAllBrandsMeetMinimum,
} from '@/store/cart.store';
import { BrandCartSection, CartSummary } from '@/components/cart';

export default function CartPage() {
  const router = useRouter();

  const items = useCartStore((state) => state.items);
  const getItemsByBrand = useCartStore((state) => state.getItemsByBrand);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const clearCart = useCartStore((state) => state.clearCart);

  const isEmpty = useIsCartEmpty();
  const subtotal = useCartSubtotal();
  const itemCount = useCartItemCount();
  const validationErrors = useMinimumOrderValidation();
  const allBrandsMeetMinimum = useAllBrandsMeetMinimum();

  const brandGroups = getItemsByBrand();

  const handleUpdateQuantity = (productId: string, quantity: number, variantId?: string) => {
    updateQuantity(productId, quantity, variantId);
  };

  const handleRemove = (productId: string, variantId?: string) => {
    removeFromCart(productId, variantId);
  };

  const handleCheckout = () => {
    if (allBrandsMeetMinimum) {
      router.push('/checkout');
    }
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  // Empty cart state
  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto text-center">
            {/* Empty Icon */}
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBagIcon className="w-12 h-12 text-gray-400" />
            </div>

            <h1 className="text-2xl font-bold text-secondary-800 mb-2">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">
              Looks like you haven&apos;t added anything to your cart yet.
              Browse our products and start shopping!
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-secondary-900 font-semibold rounded-lg transition-colors"
              >
                Browse Products
              </Link>
              <Link
                href="/brands"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-secondary-800 font-medium rounded-lg transition-colors"
              >
                Shop by Brand
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-secondary-800">Shopping Cart</h1>
            <p className="text-gray-600 mt-1">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} from {brandGroups.length}{' '}
              {brandGroups.length === 1 ? 'brand' : 'brands'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Continue Shopping
            </Link>
            <button
              onClick={handleClearCart}
              className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {brandGroups.map((brandGroup) => (
              <BrandCartSection
                key={brandGroup.brand.id}
                brandGroup={brandGroup}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {/* Cart Summary - Right Column */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <CartSummary
                subtotal={subtotal}
                total={subtotal}
                itemCount={itemCount}
                onCheckout={handleCheckout}
                disabled={!allBrandsMeetMinimum}
                disabledReason={
                  !allBrandsMeetMinimum
                    ? 'Please meet minimum order requirements for all brands'
                    : undefined
                }
                validationErrors={validationErrors}
              />
            </div>
          </div>
        </div>

        {/* B2B Notice */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
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
              <p className="text-sm font-medium text-blue-800">Wholesale Account Required</p>
              <p className="text-sm text-blue-700 mt-1">
                You need a verified wholesale account to complete your purchase.
                If you don&apos;t have an account yet,{' '}
                <Link href="/register" className="font-medium underline hover:no-underline">
                  apply here
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
