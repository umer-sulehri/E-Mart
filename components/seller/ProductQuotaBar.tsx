'use client';

import { useEffect, useState } from 'react';
import { Upload, AlertTriangle } from 'lucide-react';
import { formatDuration } from '@/lib/format-duration';
import { cn } from '@/lib/utils';

export interface ProductQuota {
  used: number;
  limit: number;
  remaining: number;
  /** ISO timestamp when the next slot frees, or null when the window is empty. */
  resetAt: string | null;
  exhausted: boolean;
}

/**
 * Live daily upload quota for the seller dashboard.
 *
 * Counts down in place once mounted. The first render deliberately shows a
 * static label instead of a computed duration: the server has no idea when the
 * browser's clock ticks over, so rendering `Date.now()` on the server would
 * hydrate-mismatch.
 */
export default function ProductQuotaBar({
  quota,
  loading,
  className,
}: {
  quota: ProductQuota | null;
  loading?: boolean;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (loading && !quota) {
    return (
      <div
        className={cn(
          'h-[76px] animate-pulse rounded-xl bg-muted-100',
          className
        )}
        aria-hidden="true"
      />
    );
  }

  if (!quota) return null;

  const { used, limit, remaining, resetAt, exhausted } = quota;
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const resetMs = resetAt ? new Date(resetAt).getTime() : 0;
  const countdown = now !== null && resetMs > now ? formatDuration(resetMs - now) : null;

  return (
    <section
      className={cn(
        'rounded-xl border bg-white p-4 shadow-sm',
        exhausted ? 'border-danger-200' : 'border-muted-100',
        className
      )}
      aria-label="Daily product upload allowance"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {exhausted ? (
            <AlertTriangle className="size-5 shrink-0 text-danger" aria-hidden="true" />
          ) : (
            <Upload className="size-5 shrink-0 text-primary" aria-hidden="true" />
          )}
          <p className="truncate text-sm font-medium text-secondary-800">
            <span className="font-semibold">
              {used} of {limit}
            </span>{' '}
            products uploaded today
          </p>
        </div>

        {!exhausted && remaining > 0 && (
          <p className="shrink-0 text-xs font-medium text-muted-500">
            {remaining} left
          </p>
        )}
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted-100"
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label={`${used} of ${limit} daily product uploads used`}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            exhausted
              ? 'bg-danger'
              : percent >= 80
                ? 'bg-warning'
                : 'bg-primary'
          )}
          style={{ width: `${Math.max(percent, used > 0 ? 4 : 0)}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-muted-500">
        {exhausted ? (
          <>
            Daily limit reached. Try again tomorrow
            {countdown ? ` — resets in ${countdown}` : ''}.
          </>
        ) : countdown ? (
          <>Allowance refreshes in {countdown}.</>
        ) : (
          <>You can publish {remaining} more {remaining === 1 ? 'product' : 'products'} today.</>
        )}
      </p>
    </section>
  );
}
