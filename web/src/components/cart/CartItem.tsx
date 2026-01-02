'use client';

import Link from 'next/link';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { CartItem as CartItemType } from '@/store/cart.store';
import { QuantitySelector } from '@/components/product';
import { formatCurrency, resolveImageUrl } from '@/lib/utils';
import { FallbackImage } from '@/components/ui';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  onRemove: (productId: string, variantId?: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const primaryImage = item.product.images?.find((img) => img.isPrimary) || item.product.images?.[0];

  return (
    <tr className="border-b border-gray-100 last:border-0">
      {/* Product */}
      <td className="py-4 pr-4">
        <div className="flex items-center gap-4">
          {/* Image */}
          <Link
            href={`/products/${item.product.slug}` as '/'}
            className="relative w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0"
          >
            <FallbackImage
              src={primaryImage ? resolveImageUrl(primaryImage.url) || '/images/placeholder-product.svg' : '/images/placeholder-product.svg'}
              alt={primaryImage?.alt || item.product.name}
              fill
              type="product"
              className="object-cover"
              sizes="80px"
            />
          </Link>

          {/* Details */}
          <div className="min-w-0">
            <Link
              href={`/products/${item.product.slug}` as '/'}
              className="font-medium text-secondary-800 hover:text-primary-600 transition-colors line-clamp-2"
            >
              {item.product.name}
            </Link>
            {item.variant && (
              <p className="text-sm text-gray-500 mt-0.5">{item.variant.name}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">SKU: {item.product.sku}</p>
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="py-4 px-4 text-center">
        <span className="font-medium text-secondary-800">
          {formatCurrency(item.variant?.price ?? item.product.price ?? 0)}
        </span>
      </td>

      {/* Quantity */}
      <td className="py-4 px-4">
        <div className="flex justify-center">
          <QuantitySelector
            value={item.quantity}
            onChange={(qty) => onUpdateQuantity(item.productId, qty, item.variantId)}
            min={item.product.minOrderQuantity || 1}
            max={Math.min(
              item.product.maxOrderQuantity || 999,
              item.variant?.stock ?? item.product.stock
            )}
            size="sm"
          />
        </div>
      </td>

      {/* Subtotal */}
      <td className="py-4 px-4 text-center">
        <span className="font-semibold text-secondary-800">
          {formatCurrency(item.subtotal)}
        </span>
      </td>

      {/* Remove */}
      <td className="py-4 pl-4">
        <button
          onClick={() => onRemove(item.productId, item.variantId)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Remove item"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
}

// Mobile-friendly cart item card
export function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const primaryImage = item.product.images?.find((img) => img.isPrimary) || item.product.images?.[0];

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
      {/* Image */}
      <Link
        href={`/products/${item.product.slug}` as '/'}
        className="relative w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0"
      >
        <FallbackImage
          src={primaryImage ? resolveImageUrl(primaryImage.url) || '/images/placeholder-product.svg' : '/images/placeholder-product.svg'}
          alt={primaryImage?.alt || item.product.name}
          fill
          type="product"
          className="object-cover"
          sizes="96px"
        />
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div>
            <Link
              href={`/products/${item.product.slug}` as '/'}
              className="font-medium text-secondary-800 hover:text-primary-600 transition-colors line-clamp-2"
            >
              {item.product.name}
            </Link>
            {item.variant && (
              <p className="text-sm text-gray-500 mt-0.5">{item.variant.name}</p>
            )}
          </div>
          <button
            onClick={() => onRemove(item.productId, item.variantId)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Remove item"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-primary-600 font-medium mt-1">
          {formatCurrency(item.variant?.price ?? item.product.price ?? 0)}
        </p>

        <div className="flex items-center justify-between mt-3">
          <QuantitySelector
            value={item.quantity}
            onChange={(qty) => onUpdateQuantity(item.productId, qty, item.variantId)}
            min={item.product.minOrderQuantity || 1}
            max={Math.min(
              item.product.maxOrderQuantity || 999,
              item.variant?.stock ?? item.product.stock
            )}
            size="sm"
          />
          <span className="font-semibold text-secondary-800">
            {formatCurrency(item.subtotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
