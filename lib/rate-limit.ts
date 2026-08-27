type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60 * 1000;

export function rateLimit(key: string, limit: number, windowMs = WINDOW_MS) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
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

export function rateLimitByIp(
  request: Request,
  limit: number,
  windowMs = WINDOW_MS
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return rateLimit(`ip:${ip}`, limit, windowMs);
}
