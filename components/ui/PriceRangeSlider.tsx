'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  currency?: string;
  className?: string;
}

export default function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  currency = '₨',
  className,
}: PriceRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);

  // A broad (0 .. 10,000,000) price domain renders linear thumb positions that
  // squeeze every real product into a few pixels, so positions map through a
  // logarithmic scale: low prices stay precisely selectable while the slider
  // still reaches the configured upper bound.
  const span = max - min;
  const logSpan = span > 0 ? Math.log10(span + 1) : 1;

  const toT = useCallback(
    (v: number) => {
      const clamped = Math.max(min, Math.min(max, v));
      return Math.log10(clamped - min + 1) / logSpan;
    },
    [min, max, logSpan]
  );

  const fromT = useCallback(
    (t: number) => {
      const v = min + Math.pow(10, t * logSpan) - 1;
      return Math.max(min, Math.min(max, v));
    },
    [min, max, logSpan]
  );

  const getPercent = useCallback((v: number) => toT(v) * 100, [toT]);

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(fromT(t));
    },
    [fromT, min]
  );

  useEffect(() => {
    if (!dragging) return;

    function handleMove(e: MouseEvent | TouchEvent) {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const val = getValueFromPosition(clientX);

      if (dragging === 'min') {
        onChange([Math.min(val, value[1] - 1), value[1]]);
      } else {
        onChange([value[0], Math.max(val, value[0] + 1)]);
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
  }, [dragging, value, onChange, getValueFromPosition]);

  const leftValue = Math.max(min, Math.min(max, Math.round(value[0])));
  const rightValue = Math.max(min, Math.min(max, Math.round(value[1])));
  const leftPercent = getPercent(leftValue);
  const rightPercent = getPercent(rightValue);

  const nudge = (v: number, dir: -1 | 1) => {
    const clamped = Math.max(min, Math.min(max, v));
    const t = toT(clamped);
    let next = Math.round(fromT(Math.max(0, Math.min(1, t + 0.01 * dir))));
    if (next === clamped) next = clamped + dir;
    return Math.max(min, Math.min(max, next));
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between text-sm text-secondary-700">
        <span>
          {currency}{leftValue.toLocaleString()}
        </span>
        <span>
          {currency}{rightValue.toLocaleString()}
        </span>
      </div>

      <div
        ref={trackRef}
        className="relative h-2 cursor-pointer rounded-full bg-muted-200"
        onClick={(e) => {
          const val = getValueFromPosition(e.clientX);
          const distToMin = Math.abs(val - leftValue);
          const distToMax = Math.abs(val - rightValue);
          if (distToMin < distToMax) {
            onChange([Math.min(val, rightValue - 1), rightValue]);
          } else {
            onChange([leftValue, Math.max(val, leftValue + 1)]);
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
          aria-label="Minimum price"
          aria-valuemin={min}
          aria-valuemax={rightValue}
          aria-valuenow={leftValue}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              onChange([Math.min(nudge(leftValue, 1), rightValue - 1), rightValue]);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              onChange([Math.max(nudge(leftValue, -1), min), rightValue]);
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
          aria-label="Maximum price"
          aria-valuemin={leftValue}
          aria-valuemax={max}
          aria-valuenow={rightValue}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              onChange([leftValue, Math.max(Math.min(nudge(rightValue, 1), max), leftValue + 1)]);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              onChange([leftValue, Math.max(nudge(rightValue, -1), leftValue + 1)]);
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