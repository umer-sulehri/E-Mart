'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons';

interface CarouselProps {
  children: React.ReactNode;
  className?: string;
  step?: number;
}

export function Carousel({ children, className = '', step = 300 }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const isRtl = document.documentElement.getAttribute('dir') === 'rtl';
    if (isRtl) {
      const maxScroll = el.scrollWidth - el.clientWidth;
      setCanPrev(el.scrollLeft < -1);
      setCanNext(el.scrollLeft > -(maxScroll + 1));
    } else {
      setCanPrev(el.scrollLeft > 1);
      setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows]);

  const scrollBy = (dir: 'prev' | 'next') => {
    const el = trackRef.current;
    if (!el) return;
    const isRtl = document.documentElement.getAttribute('dir') === 'rtl';
    const amount = (dir === 'prev' ? -1 : 1) * step * (isRtl ? -1 : 1);
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-2 scrollbar-hide"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {children}
      </div>
      <div className="swiper-buttons absolute top-0 flex gap-2" style={{ insetInlineEnd: '220px' }}>
        <button
          type="button"
          aria-label="Previous"
          onClick={() => scrollBy('prev')}
          disabled={!canPrev}
          className="swiper-btn"
          style={{ opacity: canPrev ? 1 : 0.35 }}
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => scrollBy('next')}
          disabled={!canNext}
          className="swiper-btn"
          style={{ opacity: canNext ? 1 : 0.35 }}
        >
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
