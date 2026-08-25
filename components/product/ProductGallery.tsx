'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ZoomIn } from 'lucide-react';

export interface ProductGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

const ProductGallery = React.forwardRef<HTMLDivElement, ProductGalleryProps>(
  ({ images, productName, className }, ref) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [isZoomed, setIsZoomed] = React.useState(false);
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
    const imageContainerRef = React.useRef<HTMLDivElement>(null);

    const selectedImage = images[selectedIndex] || images[0];

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageContainerRef.current) return;
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      },
      []
    );

    return (
      <div ref={ref} className={cn('flex flex-col-reverse gap-3 lg:flex-row', className)}>
        {/* Thumbnails */}
        <div className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-y-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all lg:h-[72px] lg:w-[72px]',
                selectedIndex === index
                  ? 'border-primary'
                  : 'border-muted-200 hover:border-muted-400'
              )}
            >
              <Image
                src={image}
                alt={`${productName} - Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="72px"
              />
            </button>
          ))}
        </div>

        {/* Main Image */}
        <div
          ref={imageContainerRef}
          className="relative flex-1 overflow-hidden rounded-xl bg-muted-50"
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
          onMouseMove={handleMouseMove}
        >
          <div className="relative aspect-square w-full overflow-hidden">
            <Image
              src={selectedImage}
              alt={productName}
              fill
              className={cn(
                'object-contain transition-transform duration-300',
                isZoomed && 'scale-150'
              )}
              style={
                isZoomed
                  ? {
                      transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                    }
                  : undefined
              }
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          {/* Zoom indicator */}
          <div
            className={cn(
              'absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-secondary-700 shadow-sm backdrop-blur-sm transition-opacity',
              isZoomed ? 'opacity-0' : 'opacity-100'
            )}
          >
            <ZoomIn size={14} />
            Hover to zoom
          </div>
        </div>
      </div>
    );
  }
);

ProductGallery.displayName = 'ProductGallery';

export default ProductGallery;
