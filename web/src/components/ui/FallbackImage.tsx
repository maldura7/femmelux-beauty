'use client';

import { useState, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';

type ImageType = 'product' | 'brand' | 'avatar' | 'generic';

interface FallbackImageProps extends Omit<ImageProps, 'onError'> {
  type?: ImageType;
  fallbackSrc?: string;
  fallbackClassName?: string;
}

const PLACEHOLDER_IMAGES: Record<ImageType, string> = {
  product: '/images/placeholder-product.svg',
  brand: '/images/placeholder-brand.svg',
  avatar: '/images/placeholder-product.svg',
  generic: '/images/placeholder-product.svg',
};

export function FallbackImage({
  src,
  alt,
  type = 'generic',
  fallbackSrc,
  fallbackClassName,
  className,
  ...props
}: FallbackImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc || PLACEHOLDER_IMAGES[type]);
    }
  }, [hasError, fallbackSrc, type]);

  // Reset state when src changes
  if (src !== imgSrc && !hasError) {
    setImgSrc(src);
  }

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      className={hasError && fallbackClassName ? fallbackClassName : className}
      onError={handleError}
      unoptimized={hasError}
    />
  );
}

export default FallbackImage;
