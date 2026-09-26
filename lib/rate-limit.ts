import { kv } from "@vercel/kv";

type Bucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, Bucket>();

const WINDOW_MS = 60 * 1000;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec?: number;
}

function kvConfigured(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL &&
      process.env.KV_REST_API_TOKEN &&
      process.env.KV_REST_API_READ_ONLY_TOKEN
  );
}

/**
 * True when a Redis counter can be shared across serverless instances.
 *
 * When this is false every counter falls back to an in-process `Map`, which
 * is per-lambda: the limit can be bypassed by hitting a different instance and
 * resets on cold start. Callers enforcing a limit that must hold across the
 * deployment need their own authoritative (database) fallback — see
 * `lib/seller-quota.ts`.
 */
export function isKvConfigured(): boolean {
  return kvConfigured();
}

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return {
    success: true,
    remaining: limit - bucket.count,
    resetAt: bucket.resetAt,
  };
}

/**
 * Read the current state of a counter WITHOUT consuming a slot.
 *
 * `rateLimit()` always increments, so it cannot back an endpoint that only
 * reports usage (e.g. "how many product uploads do I have left today?").
 */
function memoryPeekRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    return { success: true, remaining: limit, resetAt: now + windowMs };
  }

  // See the note in `kvPeekRateLimit`: the stored count is what has already
  // been consumed, so a further write needs `count < limit`.
  const success = bucket.count < limit;
  return {
    success,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterSec: success
      ? undefined
      : Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

async function kvRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const fullKey = `ratelimit:${key}`;
  const ttlSec = Math.max(1, Math.ceil(windowMs / 1000));

  const count = await kv.incr(fullKey);
  if (count === 1) {
    await kv.expire(fullKey, ttlSec);
  }

  const ttl = await kv.ttl(fullKey);
  const resetAt = ttl > 0 ? Date.now() + ttl * 1000 : Date.now() + windowMs;
  const success = count <= limit;

  return {
    success,
    remaining: Math.max(0, limit - count),
    resetAt,
    retryAfterSec: success ? undefined : Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
  };
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs = WINDOW_MS
): Promise<RateLimitResult> {
  if (kvConfigured()) {
    try {
      return await kvRateLimit(key, limit, windowMs);
    } catch {
      // fall back to memory if KV is configured but unreachable
    }
  }
  return memoryRateLimit(key, limit, windowMs);
}

/**
 * Inspect a counter without incrementing it.
 *
 * Mirrors `rateLimit()`'s return shape so callers can treat both the same
 * way, but consumes no slot — safe for GET endpoints that only display usage.
 */
export async function peekRateLimit(
  key: string,
  limit: number,
  windowMs = WINDOW_MS
): Promise<RateLimitResult> {
  if (kvConfigured()) {
    try {
      const fullKey = `ratelimit:${key}`;
      const count = (await kv.get<number>(fullKey)) ?? 0;

      if (count === 0) {
        // Nothing recorded yet: report a full allowance rather than 0.
        return { success: true, remaining: limit, resetAt: Date.now() + windowMs };
      }

      const ttl = await kv.ttl(fullKey);
      const resetAt = ttl > 0 ? Date.now() + ttl * 1000 : Date.now() + windowMs;
      // `count` is the number already consumed, so the next write is allowed
      // only while there is a slot left. This matches the blocking condition
      // in `kvRateLimit`, which refuses once the stored count has reached the
      // limit.
      const success = count < limit;

      return {
        success,
        remaining: Math.max(0, limit - count),
        resetAt,
        retryAfterSec: success
          ? undefined
          : Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
      };
    } catch {
      // fall back to memory if KV is configured but unreachable
    }
  }
  return memoryPeekRateLimit(key, limit, windowMs);
}

export async function rateLimitByIp(
  request: Request,
  limit: number,
  windowMs = WINDOW_MS
): Promise<RateLimitResult> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return rateLimit(`ip:${ip}`, limit, windowMs);
}

/**
 * Seller/user-scoped limit. Preferred over `rateLimitByIp` for authenticated
 * routes: it is immune to shared NAT egress IPs (a whole office or carrier NAT
 * pool sharing one address would otherwise throttle itself) and cannot be
 * sidestepped by rotating IPs.
 */
export async function rateLimitByUserId(
  userId: string,
  limit: number,
  windowMs = WINDOW_MS
): Promise<RateLimitResult> {
  return rateLimit(`user:${userId}`, limit, windowMs);
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
  if (result.retryAfterSec) {
    headers["Retry-After"] = String(result.retryAfterSec);
  }
  return headers;
}