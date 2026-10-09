import type { SupabaseClient } from '@supabase/supabase-js';
import { peekRateLimit, rateLimit, isKvConfigured } from '@/lib/rate-limit';
import {
  MAX_PRODUCTS_PER_DAY as LIMIT,
  QUOTA_EXCEEDED_MESSAGE,
  DAILY_PRODUCT_LIMIT_CODE,
  quotaDayStart,
  quotaResetAt as resetAtFor,
  quotaDayKey,
  isQuotaExempt,
} from '@/lib/product-limit';

/**
 * ---------------------------------------------------------------------------
 * Daily product-upload allowance — server side
 * ---------------------------------------------------------------------------
 *
 * A seller may create at most {@link MAX_PRODUCTS_PER_DAY} products per calendar
 * day. The day window is a **fixed** one: it starts at midnight in
 * `Asia/Karachi` (PKT, UTC+05:00) and ends at the next PKT midnight.
 *
 * The rule itself — the limit, the day boundary, the reset arithmetic — lives in
 * lib/product-limit.ts, which is dependency-free and therefore safe to import
 * from client components. This module adds only what needs the server: the
 * database count and the Redis fast path. Re-exported here so server code has a
 * single import site.
 *
 * Rules, in one place:
 *
 *  - **Creations only.** Editing a product (PUT) never consumes a slot.
 *  - **Deleted products still count.** The count is taken against the `products`
 *    table with no status filter, so removing a product and re-adding it cannot
 *    buy another slot. Drafts and archived products count too.
 *  - **Counted per creator** (`vendor_id`). One vendor never consumes another
 *    vendor's allowance.
 *  - **Admins are exempt** by default, via {@link isQuotaExempt}.
 *
 * Enforcement is layered:
 *
 *  1. This module, called from the API routes, fails fast with a 429 so the
 *     seller gets a friendly message before any insert is attempted. The Redis
 *     counter makes that check free for an already-blocked seller.
 *  2. A Postgres `BEFORE INSERT` trigger (supabase/2027-product-daily-limit.sql)
 *     is the authoritative gate. It closes the check-then-insert race and also
 *     covers paths this module does not, such as a direct PostgREST insert.
 *
 * If the trigger is not installed, behaviour degrades to the application check
 * alone — still enforced, just not race-proof.
 */

export {
  MAX_PRODUCTS_PER_DAY,
  QUOTA_TIMEZONE,
  QUOTA_EXEMPT_ADMINS,
  DAILY_PRODUCT_LIMIT_CODE,
  QUOTA_EXCEEDED_MESSAGE,
  quotaDayStart,
  quotaResetAt,
  quotaDayKey,
  isQuotaExempt,
  formatQuotaResetClock,
} from '@/lib/product-limit';

import { MAX_PRODUCTS_PER_DAY as LIMIT_VAL, quotaResetAt as RESET_AT } from '@/lib/product-limit';

/**
 * How often a single seller may *attempt* a product upload.
 *
 * This is an abuse guard, deliberately separate from (and far more generous
 * than) the daily allowance: it exists so a blocked seller spamming the
 * endpoint cannot hammer the database, while still allowing a legitimate seller
 * to create their full daily allowance in one burst.
 */
export const PRODUCT_UPLOAD_ATTEMPT_LIMIT = 60;
export const PRODUCT_UPLOAD_ATTEMPT_WINDOW_MS = 60 * 1000;

export type QuotaSource = 'redis' | 'database';

export interface QuotaStatus {
  /** Products this vendor created today. */
  used: number;
  limit: number;
  remaining: number;
  /**
   * The next PKT midnight, as a timestamp. `null` only when the caller is
   * exempt, where "when does this reset" has no useful answer.
   */
  resetAt: number | null;
  /** Present only when the allowance is spent. */
  retryAfterSec?: number;
  /** Which layer produced the authoritative number. */
  source: QuotaSource;
  /** True when the allowance does not apply to this caller at all. */
  exempt?: boolean;
}

/**
 * Redis counter key, namespaced per seller *and* per quota day.
 *
 * Date-stamping is correct here precisely because the window is a fixed day: the
 * key naturally expires at the day boundary instead of needing a TTL sweep, and
 * two different days can never share a counter.
 */
export function productUploadQuotaKey(vendorId: string, now: Date = new Date()): string {
  return `seller:${vendorId}:product-uploads:${quotaDayKey(now)}`;
}

/** Milliseconds left in the current quota day — the counter's TTL. */
function dayRemainingMs(now: Date): number {
  return Math.max(1000, RESET_AT(now).getTime() - now.getTime());
}

/**
 * Authoritative count of products this vendor created today.
 *
 * A single indexed query (see supabase/2027-product-daily-limit.sql for the
 * `(vendor_id, created_at)` index) counts creations inside the day window. There
 * is deliberately no status filter: a product that was later deleted or
 * archived still consumes its slot, which is what stops delete-and-re-add from
 * being a way around the limit.
 *
 * The caller must have already resolved the vendor and be authorised to read
 * this vendor's products; the request-scoped Supabase client applies RLS.
 */
export async function countProductsCreatedToday(
  supabase: SupabaseClient,
  vendorId: string,
  now: Date = new Date()
): Promise<{ used: number }> {
  const { count, error } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .gte('created_at', quotaDayStart(now).toISOString());

  if (error) {
    // Fail closed: if usage cannot be determined we must not hand out a slot
    // we cannot account for. Surfacing the error lets the route return 503
    // rather than silently letting the seller through.
    throw error;
  }

  return { used: count ?? 0 };
}

function toStatus(
  used: number,
  now: Date,
  limit: number,
  source: QuotaSource,
  exempt = false
): QuotaStatus {
  const remaining = exempt ? limit : Math.max(0, limit - used);
  const resetAt = exempt ? null : resetAtFor(now).getTime();

  const status: QuotaStatus = {
    used,
    limit,
    remaining,
    resetAt,
    source,
    ...(exempt ? { exempt: true } : {}),
  };

  if (remaining === 0 && resetAt !== null) {
    status.retryAfterSec = Math.max(1, Math.ceil((resetAt - now.getTime()) / 1000));
  }

  return status;
}

/** The allowance reported to an exempt caller — never exhausted, never resets. */
export function exemptQuotaStatus(limit: number = LIMIT_VAL): QuotaStatus {
  return toStatus(0, new Date(), limit, 'database', true);
}

/**
 * Read-only allowance snapshot for the seller UI. Never consumes a slot.
 *
 * Backed by the database rather than the Redis counter so the number the seller
 * sees is the number of products they actually created today.
 */
export async function getProductUploadQuota(
  supabase: SupabaseClient,
  vendorId: string,
  now: Date = new Date()
): Promise<QuotaStatus> {
  const { used } = await countProductsCreatedToday(supabase, vendorId, now);
  return toStatus(used, now, LIMIT_VAL, 'database');
}

/**
 * Ask whether the seller may create one more product right now.
 *
 * Layering, and why it cannot produce a false rejection:
 *
 *  1. Peek the Redis counter. It is only ever incremented *after* a product
 *     insert succeeds, so `redisCount <= dbCount` always holds. Therefore if
 *     Redis reports the day as full, the database agrees, and we can reject
 *     without a query — which is what stops a blocked seller from hammering
 *     Postgres.
 *  2. Otherwise take the authoritative count from the database. Redis may lag
 *     the database if a request was interrupted between insert and increment,
 *     so this branch must never trust Redis alone.
 *  3. When Redis is not configured, go straight to the database. Without this
 *     the limit would fall back to a per-lambda in-memory counter that resets
 *     on cold start and is bypassable across instances.
 */
export async function checkProductUploadQuota(
  supabase: SupabaseClient,
  vendorId: string,
  now: Date = new Date()
): Promise<QuotaStatus> {
  const key = productUploadQuotaKey(vendorId, now);

  if (isKvConfigured()) {
    const peeked = await peekRateLimit(
      key,
      LIMIT_VAL,
      Math.ceil(dayRemainingMs(now) / 1000)
    );
    if (!peeked.success) {
      // Redis says full, and Redis can only under-count relative to the DB.
      return toStatus(LIMIT_VAL, now, LIMIT_VAL, 'redis');
    }
  }

  const { used } = await countProductsCreatedToday(supabase, vendorId, now);
  return toStatus(used, now, LIMIT_VAL, 'database');
}

/**
 * Record a successful product creation against the Redis counter.
 *
 * Call this only AFTER the insert succeeds, so the invariant that
 * `redisCount <= dbCount` holds. Failures are swallowed: the database is the
 * source of truth, so a missed increment costs one extra indexed count on the
 * next request.
 */
export async function recordProductUpload(
  vendorId: string,
  now: Date = new Date()
): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await rateLimit(
      productUploadQuotaKey(vendorId, now),
      LIMIT_VAL,
      dayRemainingMs(now)
    );
  } catch {
    // Non-fatal — see doc comment.
  }
}

/**
 * Standard 429 envelope for a spent allowance.
 *
 * Every creation path returns exactly this shape so the client has one thing to
 * parse: a machine-readable `code`, a human message, and the quota numbers it
 * needs to render "try again at HH:mm".
 */
export function dailyLimitErrorResponse(
  status: QuotaStatus,
  now: Date = new Date()
): {
  body: {
    success: false;
    error: { code: string; message: string };
    meta: { limit: number; used: number; remaining: number; resetAt: string | null };
  };
  headers: Record<string, string>;
} {
  const resetAtMs = status.resetAt ?? RESET_AT(now).getTime();
  // Derived from `now` rather than Date.now() so the header agrees with the
  // resetAt in the body and the function stays deterministic.
  const retryAfterSec =
    status.retryAfterSec ?? Math.max(1, Math.ceil((resetAtMs - now.getTime()) / 1000));

  return {
    body: {
      success: false,
      error: { code: DAILY_PRODUCT_LIMIT_CODE, message: QUOTA_EXCEEDED_MESSAGE },
      meta: {
        limit: status.limit,
        used: status.used,
        remaining: 0,
        resetAt: new Date(resetAtMs).toISOString(),
      },
    },
    headers: {
      'Retry-After': String(retryAfterSec),
      'X-RateLimit-Limit': String(status.limit),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.ceil(resetAtMs / 1000)),
    },
  };
}

/**
 * Whether a Postgres error is the `BEFORE INSERT` trigger refusing an insert.
 *
 * The trigger (supabase/2027-product-daily-limit.sql) raises with SQLSTATE
 * `P0001` and a sentinel message. This is what makes the limit race-safe: even
 * if two requests both pass the application check above, the database refuses
 * the one that would exceed the allowance.
 */
export function isDailyLimitDatabaseError(error: unknown): boolean {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : '';
  return message.includes(DAILY_PRODUCT_LIMIT_CODE);
}

/**
 * How many items of a bulk creation a seller may still create today.
 *
 * `Infinity` for an exempt caller, so a bulk path needs no exemption branch of
 * its own.
 */
export function remainingImportBudget(quota: QuotaStatus): number {
  return quota.exempt ? Number.POSITIVE_INFINITY : quota.remaining;
}

export interface ImportBudgetPlan<T> {
  /** The leading slice the seller may actually create. */
  accepted: T[];
  /** Everything after it, refused because the allowance is spent. */
  rejected: T[];
  /** True when at least one item was refused. */
  hitLimit: boolean;
}

/**
 * Split a bulk creation into the part that fits in the remaining allowance and
 * the part that does not.
 *
 * Deliberately takes the first N rather than sampling: a seller uploading 40
 * rows into 3 remaining slots should get their first 3 and a clear reason for
 * the other 37, not an arbitrary subset. Rejected items are returned intact so
 * the caller can name them and the seller can fix them rather than guess which
 * rows were lost.
 *
 * Pure, so the over-quota behaviour is unit tested rather than only observable
 * through a CSV upload.
 */
export function planImportAgainstQuota<T>(
  items: readonly T[],
  quota: QuotaStatus
): ImportBudgetPlan<T> {
  const budget = remainingImportBudget(quota);

  // A non-finite budget means exempt: nothing is ever refused.
  if (!Number.isFinite(budget) || items.length <= budget) {
    return { accepted: [...items], rejected: [], hitLimit: false };
  }

  const acceptedCount = Math.max(0, budget);
  return {
    accepted: items.slice(0, acceptedCount),
    rejected: items.slice(acceptedCount),
    hitLimit: true,
  };
}