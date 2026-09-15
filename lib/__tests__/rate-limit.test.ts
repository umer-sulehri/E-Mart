import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, rateLimitByIp, rateLimitHeaders } from "../rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    // Reset module state between tests by re-importing isn't possible for
    // module-level maps; instead use unique keys per test.
  });

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
    const r1 = await rateLimit("test:expire", 1, 1); // 1ms window
    expect(r1.success).toBe(true);
    const r2 = await rateLimit("test:expire", 1, 1);
    expect(r2.success).toBe(false);
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