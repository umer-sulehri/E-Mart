'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  currency?: string;
  className?: string;
}

export default function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  currency = '₨',
  className,
}: PriceRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);

  const getPercent = (val: number) =>
    ((val - min) / (max - min)) * 100;

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      );
      const raw = min + percent * (max - min);
      return Math.round(raw / step) * step;
    },
    [min, max, step]
  );

  useEffect(() => {
    if (!dragging) return;

    function handleMove(e: MouseEvent | TouchEvent) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const val = getValueFromPosition(clientX);

      if (dragging === 'min') {
        onChange([Math.min(val, value[1] - step), value[1]]);
      } else {
        onChange([value[0], Math.max(val, value[0] + step)]);
      }
    }

    function handleUp() {
      setDragging(null);
    }

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleUp);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
    };
  }, [dragging, value, onChange, getValueFromPosition, step]);

  const leftPercent = getPercent(value[0]);
  const rightPercent = getPercent(value[1]);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between text-sm text-secondary-700">
        <span>
          {currency}{value[0].toLocaleString()}
        </span>
        <span>
          {currency}{value[1].toLocaleString()}
        </span>
      </div>

      <div
        ref={trackRef}
        className="relative h-2 cursor-pointer rounded-full bg-muted-200"
        onClick={(e) => {
          const val = getValueFromPosition(e.clientX);
          const distToMin = Math.abs(val - value[0]);
          const distToMax = Math.abs(val - value[1]);
          if (distToMin < distToMax) {
            onChange([Math.min(val, value[1] - step), value[1]]);
          } else {
            onChange([value[0], Math.max(val, value[0] + step)]);
          }
        }}
      >
        {/* Active range */}
        <div
          className="absolute h-full rounded-full bg-primary"
          style={{
            left: `${leftPercent}%`,
            width: `${rightPercent - leftPercent}%`,
          }}
        />

        {/* Min thumb */}
        <div
          className="absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white shadow-sm transition-shadow hover:shadow-md"
          style={{ left: `${leftPercent}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setDragging('min');
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            setDragging('min');
          }}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={value[1]}
          aria-valuenow={value[0]}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              onChange([Math.min(value[0] + step, value[1] - step), value[1]]);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              onChange([Math.max(value[0] - step, min), value[1]]);
            }
          }}
        />

        {/* Max thumb */}
        <div
          className="absolute top-1/2 z-10 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white shadow-sm transition-shadow hover:shadow-md"
          style={{ left: `${rightPercent}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setDragging('max');
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            setDragging('max');
          }}
          role="slider"
          aria-valuemin={value[0]}
          aria-valuemax={max}
          aria-valuenow={value[1]}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              onChange([value[0], Math.min(value[1] + step, max)]);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              onChange([value[0], Math.max(value[1] - step, value[0] + step)]);
            }
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-400">
        <span>{currency}{min.toLocaleString()}</span>
        <span>{currency}{max.toLocaleString()}</span>
      </div>
    </div>
  );
}
