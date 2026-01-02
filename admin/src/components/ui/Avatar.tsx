'use client';

import { forwardRef, ImgHTMLAttributes } from 'react';
import { cn, getInitials, stringToColor } from '@/lib/utils';

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, name, size = 'md', alt, ...props }, ref) => {
    const sizes = {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg',
    };

    const initials = name ? getInitials(name.split(' ')[0], name.split(' ')[1]) : '?';
    const bgColor = name ? stringToColor(name) : '#6B7280';

    if (src) {
      return (
        <div ref={ref} className={cn('relative rounded-full overflow-hidden', sizes[size], className)}>
          <img src={src} alt={alt || name || 'Avatar'} className="h-full w-full object-cover" {...props} />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-full flex items-center justify-center font-medium text-white',
          sizes[size],
          className
        )}
        style={{ backgroundColor: bgColor }}
      >
        {initials}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
