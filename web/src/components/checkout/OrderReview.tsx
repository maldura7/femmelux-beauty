'use client';

import Image from 'next/image';
import { formatCurrency, resolveImageUrl } from '@/lib/utils';
import type { CartItem as CartItemType } from '@/store/cart.store';
import type { ShippingFormData } from './ShippingForm';

interface OrderReviewProps {
  items: CartItemType[];
  shippingData: ShippingFormData;
  subtotal: number;
  tax?: number;
  shipping?: number;
  total: number;
  onEdit?: (section: 'shipping' | 'billing') => void;
}

export function OrderReview({
  items,
  shippingData,
  subtotal,
  tax = 0,
  shipping = 0,
  total,
  onEdit,
}: OrderReviewProps) {
  // Group items by brand
  const itemsByBrand = items.reduce((acc, item) => {
    const brandId = item.product.brand.id;
    if (!acc[brandId]) {
      acc[brandId] = {
        brand: item.product.brand,
        items: [],
      };
    }
    acc[brandId].items.push(item);
    return acc;
  }, {} as Record<string, { brand: { id: string; name: string; slug: string }; items: CartItemType[] }>);

  return (
    <div className="space-y-6">
      {/* Shipping Address Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-800">Shipping Address</h3>
          {onEdit && (
            <button
              onClick={() => onEdit('shipping')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Edit
            </button>
          )}
        </div>
        <div className="text-gray-600 space-y-1">
          <p className="font-medium text-secondary-800">
            {shippingData.firstName} {shippingData.lastName}
          </p>
          {shippingData.company && <p>{shippingData.company}</p>}
          <p>{shippingData.address}</p>
          {shippingData.address2 && <p>{shippingData.address2}</p>}
          <p>
            {shippingData.city}, {shippingData.state} {shippingData.postalCode}
          </p>
          <p>{shippingData.country}</p>
          <p className="pt-2">{shippingData.email}</p>
          <p>{shippingData.phone}</p>
        </div>
        {shippingData.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-500 mb-1">Order Notes:</p>
            <p className="text-gray-600">{shippingData.notes}</p>
          </div>
        )}
      </div>

      {/* Order Items Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-secondary-800 mb-4">Order Items</h3>

        <div className="space-y-6">
          {Object.values(itemsByBrand).map(({ brand, items: brandItems }) => (
            <div key={brand.id}>
              {/* Brand Header */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                <span className="text-sm font-semibold text-secondary-700">{brand.name}</span>
                <span className="text-xs text-gray-400">
                  ({brandItems.length} {brandItems.length === 1 ? 'item' : 'items'})
                </span>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {brandItems.map((item) => {
                  const primaryImage =
                    item.product.images?.find((img) => img.isPrimary) || item.product.images?.[0];

                  return (
                    <div key={`${item.productId}-${item.variantId || ''}`} className="flex gap-4">
                      {/* Image */}
                      <div className="relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                        {primaryImage ? (
                          <Image
                            src={resolveImageUrl(primaryImage.url) || ''}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg
                              className="w-8 h-8"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-secondary-800 text-sm line-clamp-1">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">SKU: {item.product.sku}</p>
                        {item.variant && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.variant.name}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.variant?.price ?? item.product.price ?? 0)} x {item.quantity}
                          </p>
                          <p className="text-sm font-medium text-secondary-800">
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-secondary-800 mb-4">Order Summary</h3>

        <div className="space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex justify-between text-gray-600">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'Calculated at next step' : formatCurrency(shipping)}</span>
          </div>

          {tax > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>
          )}

          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-secondary-800">Total</span>
              <span className="text-xl font-bold text-primary-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* B2B Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-3">
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
            <p className="text-sm font-medium text-amber-800">Wholesale Order</p>
            <p className="text-sm text-amber-700 mt-1">
              This is a wholesale order. Payment terms and shipping costs will be confirmed by our
              team after order submission. You will receive an invoice via email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
