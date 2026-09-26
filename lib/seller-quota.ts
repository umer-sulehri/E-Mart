import type { SupabaseClient } from '@supabase/supabase-js';
import { peekRateLimit, rateLimit, isKvConfigured } from '@/lib/rate-limit';

/** Maximum products a single seller may create per rolling 24-hour window. */
export const DAILY_PRODUCT_UPLOAD_LIMIT = 10;

/** The quota window: 24 hours. */
export const QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * How often a single seller may *attempt* a product upload.
 *
 * This is an abuse guard, deliberately separate from (and far more generous
 * than) the daily quota: it exists so a blocked seller spamming the endpoint
 * cannot hammer the database, while still allowing a legitimate seller to
 * create their full daily allowance in one burst.
 */
export const PRODUCT_UPLOAD_ATTEMPT_LIMIT = 60;
export const PRODUCT_UPLOAD_ATTEMPT_WINDOW_MS = 60 * 1000;

export type QuotaSource = 'redis' | 'database';

export interface QuotaStatus {
  /** Uploads consumed in the current window. */
  used: number;
  limit: number;
  remaining: number;
  /**
   * When the oldest upload in the window ages out, freeing a slot — i.e. the
   * earliest moment another upload would be accepted. `null` when the window
   * is empty and there is nothing to wait for.
   */
  resetAt: number | null;
  /** Present only when the quota is exhausted. */
  retryAfterSec?: number;
  /** Which layer produced the authoritative number. */
  source: QuotaSource;
}

/**
 * Rolling-window counter key, namespaced per seller.
 *
 * Deliberately NOT date-stamped: a `...:${date}` suffix produces a UTC
 * calendar-day bucket, which is a different rule from the rolling 24-hour
 * window this quota is specified as (and would reset mid-afternoon for sellers
 * in PKT).
 */
export function productUploadQuotaKey(vendorId: string): string {
  return `seller:${vendorId}:product-uploads`;
}

function windowStartIso(): string {
  return new Date(Date.now() - QUOTA_WINDOW_MS).toISOString();
}

interface RecentProductCount {
  used: number;
  oldestCreatedAt: number | null;
}

/**
 * Authoritative count of products this vendor created in the last 24h.
 *
 * A single indexed query (see supabase/2027-seller-upload-quota.sql for the
 * `(vendor_id, created_at)` index) returns both the total and the oldest row
 * in the window, which together determine usage and the next reset time.
 *
 * The caller must have already resolved the vendor and be authorised to read
 * this vendor's products; the request-scoped Supabase client applies RLS.
 */
export async function countRecentProducts(
  supabase: SupabaseClient,
  vendorId: string
): Promise<RecentProductCount> {
  const { data, count, error } = await supabase
    .from('products')
    .select('created_at', { count: 'exact' })
    .eq('vendor_id', vendorId)
    .gte('created_at', windowStartIso())
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    // Fail closed: if usage cannot be determined we must not hand out a slot
    // we cannot account for. Surfacing the error lets the route return 500
    // rather than silently letting the seller through.
    throw error;
  }

  const oldest = data?.[0]?.created_at;
  return {
    used: count ?? 0,
    oldestCreatedAt: oldest ? new Date(oldest).getTime() : null,
  };
}

function toStatus(
  used: number,
  oldestCreatedAt: number | null,
  limit: number,
  source: QuotaSource
): QuotaStatus {
  const now = Date.now();
  const remaining = Math.max(0, limit - used);
  const exhausted = remaining === 0;

  // With an empty window there is nothing to age out. Otherwise the next slot
  // frees when the oldest upload crosses the 24h boundary, clamped forward to
  // now so the UI can never render a negative countdown.
  const resetAt =
    oldestCreatedAt === null
      ? null
      : Math.max(now, oldestCreatedAt + QUOTA_WINDOW_MS);

  const status: QuotaStatus = {
    used,
    limit,
    remaining,
    resetAt,
    source,
  };

  if (exhausted && resetAt !== null) {
    status.retryAfterSec = Math.max(1, Math.ceil((resetAt - now) / 1000));
  }

  return status;
}

/**
 * Read-only quota snapshot for the seller UI. Never consumes a slot.
 *
 * Backed by the database rather than the Redis counter so the number the
 * seller sees is the number of products they actually created.
 */
export async function getProductUploadQuota(
  supabase: SupabaseClient,
  vendorId: string
): Promise<QuotaStatus> {
  const { used, oldestCreatedAt } = await countRecentProducts(supabase, vendorId);
  return toStatus(used, oldestCreatedAt, DAILY_PRODUCT_UPLOAD_LIMIT, 'database');
}

/**
 * Ask whether the seller may create one more product right now.
 *
 * Layering, and why it cannot produce a false rejection:
 *
 *  1. Peek the Redis counter. It is only ever incremented *after* a product
 *     insert succeeds, so `redisCount <= dbCount` always holds. Therefore if
 *     Redis reports the window as full, the database agrees, and we can reject
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
  vendorId: string
): Promise<QuotaStatus> {
  const limit = DAILY_PRODUCT_UPLOAD_LIMIT;
  const key = productUploadQuotaKey(vendorId);

  if (isKvConfigured()) {
    const peeked = await peekRateLimit(key, limit, QUOTA_WINDOW_MS);
    if (!peeked.success) {
      // Redis says full, and Redis can only under-count relative to the DB.
      return toStatus(limit, peeked.resetAt, limit, 'redis');
    }
  }

  const { used, oldestCreatedAt } = await countRecentProducts(supabase, vendorId);
  return toStatus(used, oldestCreatedAt, limit, 'database');
}

/**
 * Record a successful product creation against the Redis counter.
 *
 * Call this only AFTER the insert succeeds, so the invariant that
 * `redisCount <= dbCount` holds. Failures are swallowed: the database is the
 * source of truth, so a missed increment costs one extra indexed count on the
 * next request.
 */
export async function recordProductUpload(vendorId: string): Promise<void> {
  if (!isKvConfigured()) return;
  try {
    await rateLimit(
      productUploadQuotaKey(vendorId),
      DAILY_PRODUCT_UPLOAD_LIMIT,
      QUOTA_WINDOW_MS
    );
  } catch {
    // Non-fatal — see doc comment.
  }
}

/** The message the API returns when the daily allowance is used up. */
export const QUOTA_EXCEEDED_MESSAGE = 'Daily product limit reached. Retry after 24h.';
