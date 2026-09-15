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