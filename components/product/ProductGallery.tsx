'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ZoomIn } from 'lucide-react';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

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
    const swiperRef = React.useRef<SwiperType | null>(null);

    React.useEffect(() => {
      setIsCoarsePointer(window.matchMedia('(pointer: coarse)').matches);
    }, []);

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

    const handleThumbClick = React.useCallback((index: number) => {
      setSelectedIndex(index);
      swiperRef.current?.slideTo(index);
    }, []);

    const handleSlideChange = React.useCallback((swiper: SwiperType) => {
      setSelectedIndex(swiper.activeIndex);
    }, []);

    return (
      <div ref={ref} className={cn('flex flex-col-reverse gap-3 lg:flex-row', className)}>
        {/* Thumbnails */}
        <div className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-y-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbClick(index)}
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
          className="relative w-full min-w-0 overflow-hidden rounded-xl bg-muted-50 lg:w-auto lg:flex-1 lg:self-start"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onPointerMove={handlePointerMove}
          onClick={handleTap}
          role="button"
          aria-label={isCoarsePointer && !isZoomed ? 'Tap to zoom image' : 'Product image'}
        >
          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={handleSlideChange}
            simulateTouch={false}
            spaceBetween={0}
            slidesPerView={1}
            className="w-full"
          >
            {images.map((image, index) => (
              <SwiperSlide key={index}>
                <div className="relative aspect-square w-full overflow-hidden">
                  <ImageWithFallback
                    src={image}
                    alt={`${productName} - Image ${index + 1}`}
                    fill
                    className={cn(
                      'object-contain transition-transform duration-300',
                      isZoomed && index === selectedIndex && 'scale-150'
                    )}
                    style={
                      isZoomed && index === selectedIndex
                        ? {
                            transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                          }
                        : undefined
                    }
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={index === 0}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Zoom indicator */}
          <div
            className={cn(
              'absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-secondary-700 shadow-sm backdrop-blur-sm transition-opacity',
              isZoomed ? 'opacity-0' : 'opacity-100'
            )}
          >
            <ZoomIn size={14} />
            <span className="hidden sm:inline">Hover to zoom</span>
            <span className="sm:hidden">Swipe or tap to zoom</span>
          </div>
        </div>
      </div>
    );
  }
);

ProductGallery.displayName = 'ProductGallery';

export default ProductGallery;