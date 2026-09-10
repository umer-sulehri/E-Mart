'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  pages.push(1);

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);

  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-lg border transition-colors sm:h-9 sm:w-9',
            currentPage === 1
              ? 'cursor-not-allowed border-muted-200 text-muted-300'
              : 'border-muted-200 text-secondary-800 hover:border-primary hover:text-primary'
          )}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="sm:hidden px-2 text-xs font-medium text-muted-600">
          {currentPage} / {totalPages}
        </div>

        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((page, index) =>
            page === '...' ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 w-9 items-center justify-center text-sm text-muted-400"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                  currentPage === page
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-muted-200 text-secondary-800 hover:border-primary hover:text-primary'
                )}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-lg border transition-colors sm:h-9 sm:w-9',
            currentPage === totalPages
              ? 'cursor-not-allowed border-muted-200 text-muted-300'
              : 'border-muted-200 text-secondary-800 hover:border-primary hover:text-primary'
          )}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <p className="hidden text-xs text-muted-500 sm:block">
        Page {currentPage} of {totalPages}
      </p>
    </div>
  );
}
