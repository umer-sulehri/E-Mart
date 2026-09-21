'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ZoomIn } from 'lucide-react';
import ImageWithFallback from '@/components/ui/ImageWithFallback';

export interface ProductGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

const ProductGallery = React.forwardRef<HTMLDivElement, ProductGalleryProps>(
  ({ images, productName, className }, ref) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [isZoomed, setIsZoomed] = React.useState(false);
    const [isCoarsePointer, setIsCoarsePointer] = React.useState(false);
    const [mousePosition, setMousePosition] = React.useState({ x: 50, y: 50 });
    const imageContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      setIsCoarsePointer(window.matchMedia('(pointer: coarse)').matches);
    }, []);

    const selectedImage = images[selectedIndex] || images[0];

    const handlePointerMove = React.useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!imageContainerRef.current || (!isZoomed && e.pointerType === 'mouse')) return;
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({
          x: Math.min(100, Math.max(0, x)),
          y: Math.min(100, Math.max(0, y)),
        });
      },
      [isZoomed]
    );

    const handleTap = React.useCallback(() => {
      if (isCoarsePointer) {
        setIsZoomed((prev) => !prev);
      }
    }, [isCoarsePointer]);

    const handleMouseEnter = React.useCallback(() => {
      if (!isCoarsePointer) {
        setIsZoomed(true);
      }
    }, [isCoarsePointer]);

    const handleMouseLeave = React.useCallback(() => {
      setIsZoomed(false);
      setMousePosition({ x: 50, y: 50 });
    }, []);

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
              aria-pressed={selectedIndex === index}
              aria-label={`View image ${index + 1} of ${productName}`}
            >
              <ImageWithFallback
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
          className="relative min-w-0 flex-1 self-start overflow-hidden rounded-xl bg-muted-50"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onPointerMove={handlePointerMove}
          onClick={handleTap}
          role="button"
          aria-label={isCoarsePointer && !isZoomed ? 'Tap to zoom image' : 'Product image'}
        >
          <div className="relative aspect-square w-full overflow-hidden">
            <ImageWithFallback
              src={selectedImage}
              alt={productName}
              fill
              className={cn(
                'object-cover transition-transform duration-300',
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
            <span className="hidden sm:inline">Hover to zoom</span>
            <span className="sm:hidden">Tap to zoom</span>
          </div>
        </div>
      </div>
    );
  }
);

ProductGallery.displayName = 'ProductGallery';

export default ProductGallery;