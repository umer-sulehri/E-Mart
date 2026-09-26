import { describe, it, expect } from "vitest";
import {
  rateLimit,
  rateLimitByIp,
  rateLimitByUserId,
  peekRateLimit,
  rateLimitHeaders,
} from "../rate-limit";

describe("rateLimit", () => {
  it("allows the first request and reports remaining", async () => {
    const result = await rateLimit("test:first", 5);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests after the limit is reached", async () => {
    for (let i = 0; i < 3; i++) {
      const r = await rateLimit("test:block", 3);
      expect(r.success).toBe(true);
    }
    const blocked = await rateLimit("test:block", 3);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThanOrEqual(0);
  });

  it("resets the window after expiry", async () => {
    const r1 = await rateLimit("test:expire", 1, 10); // 10ms window
    expect(r1.success).toBe(true);
    // Blocked while the window is still open.
    const r2 = await rateLimit("test:expire", 1, 10);
    expect(r2.success).toBe(false);
    // Once the window elapses the counter resets and the request is allowed
    // again. The previous version of this test used a 1ms window and asserted
    // `false` immediately, so it only passed when both calls happened to land
    // inside the same millisecond — a race that failed intermittently.
    await new Promise((resolve) => setTimeout(resolve, 20));
    const r3 = await rateLimit("test:expire", 1, 10);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("uses a custom window", async () => {
    const r = await rateLimit("test:window", 2, 5000);
    expect(r.resetAt - Date.now()).toBeLessThanOrEqual(5000);
    expect(r.resetAt - Date.now()).toBeGreaterThan(0);
  });
});

describe("rateLimitByIp", () => {
  it("extracts IP from x-forwarded-for header", async () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    const r = await rateLimitByIp(request, 3);
    expect(r.success).toBe(true);
  });

  it("uses x-real-ip as fallback", async () => {
    const request = new Request("http://localhost", {
      headers: { "x-real-ip": "198.51.100.7" },
    });
    const r = await rateLimitByIp(request, 3);
    expect(r.success).toBe(true);
  });

  it("falls back to unknown when no IP headers exist", async () => {
    const request = new Request("http://localhost");
    const r = await rateLimitByIp(request, 3);
    expect(r.success).toBe(true);
  });
});

describe("rateLimitByUserId", () => {
  it("allows requests up to the limit for a user", async () => {
    const first = await rateLimitByUserId("seller-a", 2, 60000);
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(1);

    const second = await rateLimitByUserId("seller-a", 2, 60000);
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(0);

    const third = await rateLimitByUserId("seller-a", 2, 60000);
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.retryAfterSec).toBeGreaterThan(0);
  });

  it("scopes the counter per user so one seller cannot exhaust another's", async () => {
    for (let i = 0; i < 3; i++) {
      await rateLimitByUserId("seller-exhausted", 3, 60000);
    }
    expect((await rateLimitByUserId("seller-exhausted", 3, 60000)).success).toBe(false);

    // A different user is unaffected.
    const other = await rateLimitByUserId("seller-fresh", 3, 60000);
    expect(other.success).toBe(true);
    expect(other.remaining).toBe(2);
  });
});

describe("peekRateLimit", () => {
  it("reports a full allowance for an untouched counter", async () => {
    const r = await peekRateLimit("peek:empty", 10, 60000);
    expect(r.success).toBe(true);
    expect(r.remaining).toBe(10);
  });

  it("does not consume a slot when called repeatedly", async () => {
    for (let i = 0; i < 3; i++) {
      await rateLimit("peek:consume", 10, 60000);
    }

    const a = await peekRateLimit("peek:consume", 10, 60000);
    const b = await peekRateLimit("peek:consume", 10, 60000);
    const c = await peekRateLimit("peek:consume", 10, 60000);

    expect(a.remaining).toBe(7);
    expect(b.remaining).toBe(7);
    expect(c.remaining).toBe(7);
  });

  it("still allows writes after repeated peeks", async () => {
    for (let i = 0; i < 3; i++) {
      await rateLimit("peek:writes", 5, 60000);
    }
    for (let i = 0; i < 5; i++) {
      await peekRateLimit("peek:writes", 5, 60000);
    }

    // Two slots left, so exactly two more writes succeed and the third is blocked.
    expect((await rateLimit("peek:writes", 5, 60000)).success).toBe(true);
    expect((await rateLimit("peek:writes", 5, 60000)).success).toBe(true);

    const blocked = await rateLimit("peek:writes", 5, 60000);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("reports exhaustion without blocking a counter it did not increment", async () => {
    for (let i = 0; i < 2; i++) {
      await rateLimit("peek:exhausted", 2, 60000);
    }

    const peeked = await peekRateLimit("peek:exhausted", 2, 60000);
    expect(peeked.success).toBe(false);
    expect(peeked.remaining).toBe(0);
    expect(peeked.retryAfterSec).toBeGreaterThan(0);
  });
});

describe("rateLimitHeaders", () => {
  it("returns remaining and reset headers", async () => {
    const headers = rateLimitHeaders({ success: true, remaining: 4, resetAt: 1234567890 });
    expect(headers["X-RateLimit-Remaining"]).toBe("4");
    expect(headers["X-RateLimit-Reset"]).toMatch(/^\d+$/);
  });

  it("adds Retry-After when blocked", async () => {
    const headers = rateLimitHeaders({
      success: false,
      remaining: 0,
      resetAt: Date.now() + 60000,
      retryAfterSec: 60,
    });
    expect(headers["Retry-After"]).toBe("60");
  });

  it("omits Retry-After on success", async () => {
    const headers = rateLimitHeaders({ success: true, remaining: 5, resetAt: Date.now() + 60000 });
    expect(headers["Retry-After"]).toBeUndefined();
  });
});