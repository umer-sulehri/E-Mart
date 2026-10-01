/**
 * Client-safe half of the daily product-upload allowance.
 *
 * Everything here is pure: no Supabase client, no @vercel/kv, no environment
 * variables. That matters because the seller's upload form and quota bar are
 * client components and need the limit and the reset instant for display —
 * importing them from lib/seller-quota.ts would drag the server-only Redis and
 * Supabase code into the browser bundle.
 *
 * lib/seller-quota.ts re-exports all of this, so server code has a single
 * import site and there is exactly one definition of the rule.
 */

/** IANA zone that defines the day boundary. */
export const QUOTA_TIMEZONE = 'Asia/Karachi';

/**
 * Settings key for the allowance.
 *
 * Kept as a named constant so no component or route hard-codes `10`. There is no
 * database settings table on the client side; the authoritative copy lives in
 * `app_settings.max_products_per_day` (see supabase/2027-product-daily-limit.sql)
 * and is read by the Postgres trigger. This constant is the fallback and the
 * default every route reports.
 */
export const MAX_PRODUCTS_PER_DAY = 10;

/** Settings key controlling whether admins bypass the allowance. */
export const QUOTA_EXEMPT_ADMINS = true;

/** Error code returned in the standard envelope when the allowance is spent. */
export const DAILY_PRODUCT_LIMIT_CODE = 'DAILY_PRODUCT_LIMIT';

/** The message the API returns when the daily allowance is used up. */
export const QUOTA_EXCEEDED_MESSAGE =
  `Daily limit of ${MAX_PRODUCTS_PER_DAY} products reached. Try again tomorrow.`;

/**
 * Offset in milliseconds between UTC and `QUOTA_TIMEZONE` at a given instant.
 *
 * Derived by formatting the instant in the zone and re-reading the wall clock
 * as though it were UTC, rather than hardcoding +05:00 — that keeps this
 * correct for any zone, including one that observes DST.
 */
function zoneOffsetMs(date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: QUOTA_TIMEZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = part.value;
  }

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );

  return asUtc - date.getTime();
}

/**
 * Midnight at the start of the current quota day, in `QUOTA_TIMEZONE`.
 *
 * This is the inclusive lower bound of the `created_at` range used to count a
 * seller's usage.
 */
export function quotaDayStart(now: Date = new Date()): Date {
  const offset = zoneOffsetMs(now);
  // The same instant, read as a wall clock in the quota zone.
  const local = new Date(now.getTime() + offset);

  // Midnight of that wall-clock date, then mapped back to a real instant.
  const localMidnight = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate()
  );

  return new Date(localMidnight - offset);
}

/**
 * The next PKT midnight — when the allowance frees up.
 *
 * Derived by stepping a day forward and re-deriving midnight rather than by
 * adding 24 hours to {@link quotaDayStart}, which would be wrong for a zone
 * that gains or loses an hour.
 */
export function quotaResetAt(now: Date = new Date()): Date {
  return quotaDayStart(new Date(now.getTime() + 26 * 60 * 60 * 1000));
}

/** The calendar day a timestamp belongs to, as `YYYY-MM-DD` in the quota zone. */
export function quotaDayKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: QUOTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Whether the allowance applies to a profile role.
 *
 * Admins are exempt by default so moderation and catalogue curation are never
 * throttled. Flip {@link QUOTA_EXEMPT_ADMINS} to `false` to hold admins to the
 * same allowance as sellers.
 */
export function isQuotaExempt(role: string | undefined | null): boolean {
  if (!QUOTA_EXEMPT_ADMINS) return false;
  return role === 'admin';
}

/**
 * Format the reset instant as a wall-clock time in the quota timezone.
 *
 * Returns `null` server-side and on the first client render, so the server and
 * browser markup cannot disagree about the clock.
 */
export function formatQuotaResetClock(
  resetAt: string | number | null,
  ready: boolean
): string | null {
  if (!ready || resetAt === null) return null;
  const ms = typeof resetAt === 'number' ? resetAt : new Date(resetAt).getTime();
  if (!Number.isFinite(ms)) return null;
  return new Intl.DateTimeFormat('en-PK', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: QUOTA_TIMEZONE,
  }).format(new Date(ms));
}