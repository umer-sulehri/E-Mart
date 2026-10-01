'use client';

import { useEffect, useState } from 'react';
import { Upload, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatDuration } from '@/lib/format-duration';
import { formatQuotaResetClock } from '@/lib/product-limit';
import { cn } from '@/lib/utils';

export interface ProductQuota {
  used: number;
  limit: number;
  remaining: number;
  /** ISO timestamp of the next Asia/Karachi midnight, or null when exempt. */
  resetAt: string | null;
  exhausted: boolean;
  /** True when the allowance does not apply (admins are exempt by default). */
  exempt?: boolean;
  /** IANA zone the day boundary is measured in. */
  timezone?: string;
}

/**
 * Live daily upload allowance for the seller dashboard.
 *
 * Counts down in place once mounted. The first render deliberately shows a
 * static label instead of a computed duration: the server has no idea when the
 * browser's clock ticks over, so rendering `Date.now()` on the server would
 * hydrate-mismatch.
 *
 * The day boundary is midnight Asia/Karachi (see lib/seller-quota.ts), so the
 * reset time is rendered in that zone rather than the viewer's — a seller in
 * another timezone must still see when *their* allowance refills.
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

  const { used, limit, remaining, resetAt, exhausted, exempt } = quota;
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const resetMs = resetAt ? new Date(resetAt).getTime() : 0;
  const countdown = now !== null && resetMs > now ? formatDuration(resetMs - now) : null;

  // Midnight PKT, rendered as a wall-clock time. Only after mount, so the
  // server-rendered markup cannot disagree with the browser's clock.
  const resetClock = formatQuotaResetClock(resetAt, now !== null);

  if (exempt) {
    return (
      <section
        className={cn(
          'rounded-xl border border-muted-100 bg-white p-4 shadow-sm',
          className
        )}
        aria-label="Daily product upload allowance"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 shrink-0 text-secondary" aria-hidden="true" />
          <p className="text-sm font-medium text-secondary-800">
            <span className="font-semibold">No daily upload limit</span> for admin
            accounts.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        'rounded-xl border bg-white p-4 shadow-sm',
        exhausted ? 'border-danger-200' : 'border-muted-100',
        className
      )}
      aria-label="Products created today"
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
              Products today: {used} / {limit}
            </span>
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
        aria-valuetext={`${used} of ${limit} products created today`}
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
            {resetClock ? ` at ${resetClock} PKT` : ''}
            {countdown ? ` (in ${countdown})` : ''}.
          </>
        ) : countdown ? (
          <>
            You can publish {remaining} more {remaining === 1 ? 'product' : 'products'} today
            {resetClock ? `. Resets at ${resetClock} PKT` : ''}.
          </>
        ) : (
          <>
            You can publish {remaining} more {remaining === 1 ? 'product' : 'products'} today.
          </>
        )}
      </p>
    </section>
  );
}
