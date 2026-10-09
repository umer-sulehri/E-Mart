'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pageRangeEnd, pageRangeStart } from '@/lib/pagination';

/**
 * `numbered`  full windowed page numbers (public product / category grids)
 * `simple`    previous / next plus a "Page X of Y" caption
 * `table`     `simple` plus a "Showing X-Y of Z" range, for admin tables
 */
export type PaginationVariant = 'numbered' | 'simple' | 'table';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Total row count. Enables the range caption; pairs with `itemsPerPage`. */
  totalItems?: number;
  /** Page size, used to compute the visible range alongside `totalItems`. */
  itemsPerPage?: number;
  /** Plural noun used in the caption and the nav's accessible name. */
  itemLabel?: string;
  variant?: PaginationVariant;
  /** Drop the default vertical margin when the parent already provides spacing. */
  className?: string;
  /** Scroll back to the top of the document after a page change. */
  scrollToTop?: boolean;
}

/**
 * Windowed page numbers, e.g. `1 … 4 5 [6] 7 8 … 20`. Below eight pages every
 * number is shown, which is already too many to need truncating.
 */
export function getPageNumbers(
  current: number,
  total: number
): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (current > 3) pages.push('ellipsis');

  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('ellipsis');

  pages.push(total);
  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  itemLabel,
  variant = 'numbered',
  className,
  scrollToTop = true,
}: PaginationProps) {
  // A page that no longer exists (rows deleted, filter narrowed, stale `?page=`)
  // must never leave the caller rendering an empty table under an out-of-range
  // page number, so the numbers are clamped defensively rather than trusted.
  const safeTotal = Math.max(1, Math.floor(totalPages) || 1);
  const safeCurrent = Math.min(Math.max(1, Math.floor(currentPage) || 1), safeTotal);

  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    setAnnouncement(`Page ${safeCurrent} of ${safeTotal}`);
  }, [safeCurrent, safeTotal]);

  useEffect(() => {
    if (!scrollToTop) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [safeCurrent, scrollToTop]);

  if (safeTotal <= 1) return null;

  const goTo = (page: number) => {
    const next = Math.min(Math.max(1, page), safeTotal);
    if (next !== safeCurrent) onPageChange(next);
  };

  const noun = itemLabel ?? 'results';
  // The range caption is a bonus, not a variant feature: a grid that knows its
  // total should always say so.
  const hasRange = totalItems !== undefined && totalItems > 0;
  const rangeStart = hasRange
    ? pageRangeStart(safeCurrent, itemsPerPage ?? safeTotal, totalItems)
    : 0;
  const rangeEnd = hasRange
    ? pageRangeEnd(safeCurrent, itemsPerPage ?? safeTotal, totalItems)
    : 0;

  const edgeButtonClass = (disabled: boolean) =>
    cn(
      'flex h-11 w-11 items-center justify-center rounded-lg border transition-colors sm:h-9 sm:w-9',
      // WCAG 2.4.7: a keyboard user has to be able to see which control has focus.
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
      disabled
        ? 'cursor-not-allowed border-muted-200 text-muted-300'
        : 'border-muted-200 text-secondary-800 hover:border-primary hover:text-primary'
    );

  return (
    <nav
      aria-label={`${itemLabel ? `${capitalise(itemLabel)} ` : ''}pagination`}
      className={cn('mt-8 flex flex-col items-center gap-4', className)}
    >
      {hasRange && (
        <p className="text-xs text-muted-500">
          Showing{' '}
          <span className="font-medium text-secondary-700">
            {rangeStart}-{rangeEnd}
          </span>{' '}
          of <span className="font-medium text-secondary-700">{totalItems}</span>{' '}
          {noun}
        </p>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goTo(safeCurrent - 1)}
          disabled={safeCurrent === 1}
          className={edgeButtonClass(safeCurrent === 1)}
          aria-label={
            hasRange
              ? `Previous page, showing ${rangeStart}-${rangeEnd} of ${totalItems} ${noun}`
              : 'Previous page'
          }
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        {variant === 'numbered' ? (
          <>
            <p className="px-2 text-xs font-medium text-muted-600 sm:hidden">
              {safeCurrent} / {safeTotal}
            </p>

            <div className="hidden items-center gap-1 sm:flex">
              {getPageNumbers(safeCurrent, safeTotal).map((page, index) =>
                page === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="flex h-9 w-9 items-center justify-center text-sm text-muted-400"
                    aria-hidden="true"
                  >
                    &hellip;
                  </span>
                ) : (
                  <button
                    type="button"
                    key={page}
                    onClick={() => goTo(page)}
                    aria-current={page === safeCurrent ? 'page' : undefined}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                      page === safeCurrent
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-muted-200 text-secondary-800 hover:border-primary hover:text-primary'
                    )}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
          </>
        ) : (
          <p className="px-2 text-xs font-medium text-muted-600">
            Page {safeCurrent} of {safeTotal}
          </p>
        )}

        <button
          type="button"
          onClick={() => goTo(safeCurrent + 1)}
          disabled={safeCurrent === safeTotal}
          className={edgeButtonClass(safeCurrent === safeTotal)}
          aria-label={
            hasRange
              ? `Next page, showing ${rangeStart}-${rangeEnd} of ${totalItems} ${noun}`
              : 'Next page'
          }
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      {variant === 'numbered' && !hasRange && (
        <p className="hidden text-xs text-muted-500 sm:block">
          Page {safeCurrent} of {safeTotal}
        </p>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </nav>
  );
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
