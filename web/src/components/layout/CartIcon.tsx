'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useCartItemCount } from '@/store/cart.store';
import { cn } from '@/lib/utils';

interface CartIconProps {
  className?: string;
}

export function CartIcon({ className = '' }: CartIconProps) {
  const itemCount = useCartItemCount();
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevCount, setPrevCount] = useState(itemCount);

  // Animate badge on count change
  useEffect(() => {
    if (itemCount !== prevCount && itemCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      setPrevCount(itemCount);
      return () => clearTimeout(timer);
    }
    setPrevCount(itemCount);
  }, [itemCount, prevCount]);

  return (
    <Link
      href="/cart"
      className={cn(
        'relative p-2 text-secondary-700 hover:text-primary-600 transition-colors',
        className
      )}
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingBagIcon className="h-6 w-6" />
      {itemCount > 0 && (
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-primary-500 rounded-full',
            isAnimating && 'animate-bounce'
          )}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}

export default CartIcon;
