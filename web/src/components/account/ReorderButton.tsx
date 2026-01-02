'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useCartStore } from '@/store/cart.store';
import type { OrderItem } from '@/lib/api/orders.api';
import toast from 'react-hot-toast';

interface ReorderButtonProps {
  orderId: string;
  orderItems: OrderItem[];
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function ReorderButton({
  orderId,
  orderItems,
  className = '',
  variant = 'primary',
}: ReorderButtonProps) {
  const router = useRouter();
  const addToCart = useCartStore((state) => state.addToCart);
  const [isLoading, setIsLoading] = useState(false);

  const handleReorder = async () => {
    setIsLoading(true);

    try {
      // Add each item to cart
      let addedCount = 0;
      for (const item of orderItems) {
        // Create a product object from order item for cart
        const product = {
          id: item.productId,
          name: item.productName,
          slug: item.productId, // Use productId as slug fallback
          sku: item.sku,
          description: '',
          price: item.price,
          stock: 999, // Assume in stock for reorder
          minOrderQuantity: 1,
          lowStockThreshold: 10,
          isActive: true,
          isFeatured: false,
          brand: {
            id: item.brand?.id || 'unknown',
            name: item.brand?.name || 'Unknown Brand',
            slug: item.brand?.id || 'unknown',
            logo: undefined,
            minimumOrderAmount: 0,
          },
          category: undefined,
          images: item.productImage
            ? [
                {
                  id: '1',
                  url: item.productImage,
                  alt: item.productName,
                  isPrimary: true,
                  sortOrder: 0,
                },
              ]
            : [],
          variants: [],
          priceTiers: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        addToCart(
          product,
          item.quantity,
          item.variantId
            ? {
                id: item.variantId,
                name: item.variantName || '',
                sku: item.sku,
                price: item.price,
                stock: 999,
                attributes: {},
              }
            : undefined
        );
        addedCount++;
      }

      toast.success(`Added ${addedCount} items to cart`);
      router.push('/cart');
    } catch (error) {
      toast.error('Failed to add items to cart');
    } finally {
      setIsLoading(false);
    }
  };

  const baseStyles =
    'inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-secondary-900',
    secondary: 'border border-gray-200 hover:bg-gray-50 text-secondary-800',
  };

  return (
    <button
      onClick={handleReorder}
      disabled={isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {isLoading ? (
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
      ) : (
        <>
          <ArrowPathIcon className="w-5 h-5" />
          Reorder
        </>
      )}
    </button>
  );
}
