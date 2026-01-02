'use client';

import Link from 'next/link';
import { User, canSeePrices, isPending, isRejected, isGuest, isSuspended } from '@/lib/auth';

// ============================================
// TYPES
// ============================================

interface PriceDisplayProps {
  price: number | null;
  wholesalePrice: number | null;
  user: User | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showRetailPrice?: boolean;
  className?: string;
}

// ============================================
// PRICE DISPLAY COMPONENT
// ============================================

export default function PriceDisplay({
  price,
  wholesalePrice,
  user,
  size = 'md',
  showRetailPrice = true,
  className = '',
}: PriceDisplayProps) {
  // Size classes
  const sizeClasses = {
    sm: {
      retail: 'text-xs',
      wholesale: 'text-lg font-semibold',
      message: 'text-xs',
      button: 'text-xs px-3 py-1.5',
    },
    md: {
      retail: 'text-sm',
      wholesale: 'text-2xl font-bold',
      message: 'text-sm',
      button: 'text-sm px-4 py-2',
    },
    lg: {
      retail: 'text-base',
      wholesale: 'text-3xl font-bold',
      message: 'text-base',
      button: 'text-base px-5 py-2.5',
    },
  };

  const classes = sizeClasses[size];

  // Format price helper
  const formatPrice = (value: number | null): string => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // User can see prices
  if (canSeePrices(user)) {
    return (
      <div className={`flex flex-col ${className}`}>
        {showRetailPrice && price !== null && (
          <span className={`line-through text-gray-400 ${classes.retail}`}>
            {formatPrice(price)}
          </span>
        )}
        <span className={`text-gold ${classes.wholesale}`}>
          {formatPrice(wholesalePrice)}
        </span>
        {showRetailPrice && price !== null && wholesalePrice !== null && price > wholesalePrice && (
          <span className="text-xs text-green-600">
            Save {Math.round(((price - wholesalePrice) / price) * 100)}%
          </span>
        )}
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className={`text-center p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <p className={`text-gray-700 mb-3 ${classes.message}`}>
          Login to See Wholesale Prices
        </p>
        <Link href="/login">
          <button
            className={`bg-gold hover:bg-gold/90 text-white rounded-lg font-medium transition-colors ${classes.button}`}
          >
            Login / Register
          </button>
        </Link>
      </div>
    );
  }

  // Guest - registered but not applied
  if (isGuest(user)) {
    return (
      <div className={`text-center p-4 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
        <p className={`text-blue-800 mb-3 ${classes.message}`}>
          Complete your business application to see wholesale prices
        </p>
        <Link href="/account/apply">
          <button
            className={`bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors ${classes.button}`}
          >
            Apply Now
          </button>
        </Link>
      </div>
    );
  }

  // Pending application
  if (isPending(user)) {
    return (
      <div className={`text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg
            className="w-5 h-5 text-yellow-600 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
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
          <span className={`text-yellow-800 font-medium ${classes.message}`}>
            Application Under Review
          </span>
        </div>
        <p className={`text-yellow-700 ${classes.message}`}>
          You'll see wholesale prices once approved (typically 1-2 business days)
        </p>
      </div>
    );
  }

  // Rejected application
  if (isRejected(user)) {
    return (
      <div className={`text-center p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <p className={`text-red-800 mb-3 ${classes.message}`}>
          Your application was not approved.
          {user.rejectionReason && (
            <span className="block text-red-600 mt-1">
              Reason: {user.rejectionReason}
            </span>
          )}
        </p>
        <Link href="/account/apply">
          <button
            className={`bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors ${classes.button}`}
          >
            Reapply
          </button>
        </Link>
      </div>
    );
  }

  // Suspended account
  if (isSuspended(user)) {
    return (
      <div className={`text-center p-4 bg-gray-100 border border-gray-300 rounded-lg ${className}`}>
        <p className={`text-gray-800 ${classes.message}`}>
          Your account has been suspended.
          {user.suspensionReason && (
            <span className="block text-gray-600 mt-1">
              Reason: {user.suspensionReason}
            </span>
          )}
        </p>
        <p className={`text-gray-600 mt-2 ${classes.message}`}>
          Please contact support for assistance.
        </p>
      </div>
    );
  }

  // Fallback
  return (
    <div className={`text-center p-4 bg-gray-50 rounded-lg ${className}`}>
      <p className={`text-gray-600 ${classes.message}`}>
        Price information unavailable
      </p>
    </div>
  );
}
