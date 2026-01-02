'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white';
  showText?: boolean;
  href?: string;
  className?: string;
}

const sizeConfig = {
  sm: {
    icon: 'h-8 w-8',
    iconText: 'text-lg',
    text: 'text-xl',
  },
  md: {
    icon: 'h-10 w-10',
    iconText: 'text-xl',
    text: 'text-2xl',
  },
  lg: {
    icon: 'h-12 w-12',
    iconText: 'text-2xl',
    text: 'text-3xl',
  },
};

export function Logo({
  size = 'md',
  variant = 'default',
  showText = true,
  href = '/dashboard',
  className,
}: LogoProps) {
  const config = sizeConfig[size];

  const logoContent = (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Icon */}
      <div
        className={cn(
          'rounded-lg bg-primary-500 flex items-center justify-center',
          config.icon
        )}
      >
        <span className={cn('text-white font-bold', config.iconText)}>F</span>
      </div>

      {/* Text */}
      {showText && (
        <span
          className={cn(
            'font-display font-semibold',
            config.text,
            variant === 'white' ? 'text-white' : 'text-secondary-800'
          )}
        >
          FemmeLux
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

export default Logo;
