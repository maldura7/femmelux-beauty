'use client';

import Link from 'next/link';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import type { CartBrandGroup } from '@/store/cart.store';
import { CartItem, CartItemCard } from './CartItem';
import { formatCurrency, resolveImageUrl } from '@/lib/utils';
import { FallbackImage } from '@/components/ui/FallbackImage';

interface BrandCartSectionProps {
  brandGroup: CartBrandGroup;
  onUpdateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  onRemove: (productId: string, variantId?: string) => void;
}

export function BrandCartSection({
  brandGroup,
  onUpdateQuantity,
  onRemove,
}: BrandCartSectionProps) {
  const { brand, items, subtotal, meetsMinimum, amountToMinimum } = brandGroup;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Brand Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <Link
            href={`/brands/${brand.slug}` as '/'}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative w-10 h-10 bg-white rounded-lg border border-gray-200 overflow-hidden">
              <FallbackImage
                src={resolveImageUrl(brand.logo) || '/images/placeholder-brand.svg'}
                alt={brand.name}
                fill
                type="brand"
                className="object-contain p-1"
              />
            </div>
            <span className="font-semibold text-secondary-800">{brand.name}</span>
          </Link>

          {/* Minimum Order Status */}
          {brand.minimumOrderAmount > 0 && (
            <div className="flex items-center gap-2">
              {meetsMinimum ? (
                <div className="flex items-center gap-1.5 text-green-600">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Minimum met</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-600">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {formatCurrency(amountToMinimum)} more needed
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Product</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Price</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Quantity</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Subtotal</th>
              <th className="py-3 px-4 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden px-4">
        {items.map((item) => (
          <CartItemCard
            key={item.id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
          />
        ))}
      </div>

      {/* Brand Subtotal */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {items.length} {items.length === 1 ? 'item' : 'items'} from {brand.name}
          </span>
          <div className="text-right">
            <span className="text-sm text-gray-500">Subtotal: </span>
            <span className="text-lg font-bold text-secondary-800">
              {formatCurrency(subtotal)}
            </span>
          </div>
        </div>

        {/* Minimum Order Warning */}
        {brand.minimumOrderAmount > 0 && !meetsMinimum && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 font-medium">
                  Minimum order not met
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {brand.name} requires a minimum order of {formatCurrency(brand.minimumOrderAmount)}.
                  Add {formatCurrency(amountToMinimum)} more to checkout.
                </p>
                <Link
                  href={`/brands/${brand.slug}` as '/'}
                  className="inline-block mt-2 text-xs font-medium text-amber-700 hover:text-amber-800 underline"
                >
                  Browse more from {brand.name} →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
