'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { resolveImage, FALLBACK_IMAGE } from '@/lib/imageLoader';

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

export default function ImageWithFallback({
  src,
  fallbackSrc = FALLBACK_IMAGE,
  alt,
  priority,
  ...rest
}: ImageWithFallbackProps) {
  const resolved = resolveImage(src as string | null | undefined);
  const [currentSrc, setCurrentSrc] = useState<string>(resolved);
  const [currentFallback, setCurrentFallback] = useState<string>(fallbackSrc);

  return (
    <Image
      {...rest}
      src={currentSrc}
      alt={alt || ''}
      priority={priority}
      sizes={rest.sizes}
      loading={priority ? undefined : 'lazy'}
      onError={() => {
        if (currentSrc !== currentFallback) {
          setCurrentSrc(currentFallback);
        } else if (currentFallback !== FALLBACK_IMAGE) {
          setCurrentSrc(FALLBACK_IMAGE);
          setCurrentFallback(FALLBACK_IMAGE);
        }
      }}
    />
  );
}
