'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LockClosedIcon, TruckIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { formatCurrency } from '@/lib/utils';
import type { MinimumOrderValidationError } from '@/store/cart.store';

interface CartSummaryProps {
  subtotal: number;
  tax?: number;
  shipping?: number;
  total: number;
  itemCount: number;
  onCheckout: () => void;
  disabled?: boolean;
  disabledReason?: string;
  validationErrors?: MinimumOrderValidationError[];
  isLoading?: boolean;
}

export function CartSummary({
  subtotal,
  tax,
  shipping,
  total,
  itemCount,
  onCheckout,
  disabled = false,
  disabledReason,
  validationErrors = [],
  isLoading = false,
}: CartSummaryProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const hasValidationErrors = validationErrors.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-secondary-800">Order Summary</h2>
      </div>

      {/* Summary Lines */}
      <div className="p-6 space-y-4">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="font-medium text-secondary-800">{formatCurrency(subtotal)}</span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Shipping</span>
          {shipping !== undefined ? (
            <span className="font-medium text-secondary-800">
              {shipping === 0 ? 'Free' : formatCurrency(shipping)}
            </span>
          ) : (
            <span className="text-sm text-gray-500">Calculated at checkout</span>
          )}
        </div>

        {/* Tax */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Estimated Tax</span>
          {tax !== undefined ? (
            <span className="font-medium text-secondary-800">{formatCurrency(tax)}</span>
          ) : (
            <span className="text-sm text-gray-500">Calculated at checkout</span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-4">
          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-secondary-800">Total</span>
            <span className="text-2xl font-bold text-primary-600">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Validation Errors */}
        {hasValidationErrors && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Minimum order requirements not met
                </p>
                <ul className="mt-2 space-y-1">
                  {validationErrors.map((error) => (
                    <li key={error.brandId} className="text-xs text-amber-700">
                      <span className="font-medium">{error.brandName}:</span> Need{' '}
                      {formatCurrency(error.missing)} more (min: {formatCurrency(error.required)})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Button */}
        <div className="relative">
          <button
            onClick={onCheckout}
            disabled={disabled || isLoading}
            onMouseEnter={() => disabled && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              disabled
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600 text-secondary-900 shadow-lg hover:shadow-xl'
            }`}
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
                Processing...
              </>
            ) : (
              <>
                <LockClosedIcon className="w-5 h-5" />
                Proceed to Checkout
              </>
            )}
          </button>

          {/* Tooltip */}
          {showTooltip && disabledReason && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-10">
              {disabledReason}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          )}
        </div>

        {/* Continue Shopping */}
        <Link
          href="/products"
          className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Continue Shopping
        </Link>
      </div>

      {/* Trust Badges */}
      <div className="px-6 pb-6">
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <LockClosedIcon className="w-4 h-4 text-green-500" />
            <span>Secure checkout</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TruckIcon className="w-4 h-4 text-primary-500" />
            <span>Fast shipping available</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ShieldCheckIcon className="w-4 h-4 text-primary-500" />
            <span>Authentic products guaranteed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
