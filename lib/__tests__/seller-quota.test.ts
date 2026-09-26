import { describe, it, expect } from "vitest";
import {
  DAILY_PRODUCT_UPLOAD_LIMIT,
  QUOTA_WINDOW_MS,
  QUOTA_EXCEEDED_MESSAGE,
  productUploadQuotaKey,
  getProductUploadQuota,
  checkProductUploadQuota,
  type QuotaStatus,
} from "../seller-quota";

interface FakeProduct {
  vendor_id: string;
  created_at: string;
}

interface FakeOptions {
  error?: { message: string };
}

/**
 * Minimal stand-in for the PostgREST query builder used by the quota check:
 * `.from().select().eq().gte().order().limit()` with `count: 'exact'`.
 *
 * Kept deliberately tiny — the real suite has no jsdom and no Supabase test
 * double, and adding either for this would be a dependency for one query.
 */
function createFakeSupabase(rows: FakeProduct[], options: FakeOptions = {}) {
  const seen: { vendorId: unknown; since: unknown; limit: unknown } = {
    vendorId: null,
    since: null,
    limit: null,
  };

  const client = {
    from(table: string) {
      expect(table).toBe("products");

      const chain: Record<string, unknown> = {};

      chain.select = () => chain;
      chain.eq = (_col: string, val: unknown) => {
        seen.vendorId = val;
        return chain;
      };
      chain.gte = (_col: string, val: unknown) => {
        seen.since = val;
        return chain;
      };
      chain.order = () => chain;
      chain.limit = (n: number) => {
        seen.limit = n;
        const matched = rows
          .filter(
            (r) =>
              r.vendor_id === seen.vendorId &&
              new Date(r.created_at).getTime() >= new Date(seen.since as string).getTime()
          )
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

        return Promise.resolve({
          data: matched.slice(0, n),
          count: matched.length,
          error: options.error ?? null,
        });
      };

      return chain;
    },
  };

  // The quota module only uses the one table, so the structural type is narrow.
  return { client: client as never, seen };
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

describe("productUploadQuotaKey", () => {
  it("namespaces the counter per seller", () => {
    expect(productUploadQuotaKey("vendor-1")).toBe("seller:vendor-1:product-uploads");
  });

  it("is not date-stamped, so the window rolls instead of resetting at midnight", () => {
    // A `...:${date}` suffix would create a UTC calendar-day bucket, which is a
    // different rule from the rolling 24h window and would reset mid-afternoon
    // for sellers in PKT.
    const key = productUploadQuotaKey("vendor-1");
    expect(key).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("gives each seller a distinct counter", () => {
    expect(productUploadQuotaKey("vendor-1")).not.toBe(productUploadQuotaKey("vendor-2"));
  });
});

describe("quota constants", () => {
  it("allows 10 uploads per 24h", () => {
    expect(DAILY_PRODUCT_UPLOAD_LIMIT).toBe(10);
    expect(QUOTA_WINDOW_MS).toBe(24 * 60 * 60 * 1000);
  });
});

describe("getProductUploadQuota", () => {
  it("reports a full allowance when the seller has not uploaded today", async () => {
    const { client } = createFakeSupabase([]);
    const quota = await getProductUploadQuota(client, "vendor-1");

    expect(quota.used).toBe(0);
    expect(quota.limit).toBe(10);
    expect(quota.remaining).toBe(10);
    expect(quota.resetAt).toBeNull();
    expect(quota.retryAfterSec).toBeUndefined();
  });

  it("counts only products created inside the rolling 24h window", async () => {
    const { client } = createFakeSupabase([
      { vendor_id: "vendor-1", created_at: hoursAgo(2) },
      { vendor_id: "vendor-1", created_at: hoursAgo(10) },
      // Outside the window — a product created 30h ago must not consume quota.
      { vendor_id: "vendor-1", created_at: hoursAgo(30) },
    ]);

    const quota = await getProductUploadQuota(client, "vendor-1");
    expect(quota.used).toBe(2);
    expect(quota.remaining).toBe(8);
  });

  it("never counts another seller's products", async () => {
    const { client } = createFakeSupabase([
      { vendor_id: "vendor-1", created_at: hoursAgo(1) },
      { vendor_id: "vendor-2", created_at: hoursAgo(1) },
      { vendor_id: "vendor-2", created_at: hoursAgo(2) },
    ]);

    const quota = await getProductUploadQuota(client, "vendor-1");
    expect(quota.used).toBe(1);
  });

  it("resets when the oldest upload is 19h old, i.e. 5h from now", async () => {
    const { client } = createFakeSupabase([
      { vendor_id: "vendor-1", created_at: hoursAgo(19) },
      { vendor_id: "vendor-1", created_at: hoursAgo(1) },
    ]);

    const quota = await getProductUploadQuota(client, "vendor-1");
    expect(quota.resetAt).not.toBeNull();
    const hoursUntilReset = (quota.resetAt as number - Date.now()) / (60 * 60 * 1000);
    expect(hoursUntilReset).toBeGreaterThan(4.9);
    expect(hoursUntilReset).toBeLessThan(5.1);
  });

  it("marks the quota exhausted at exactly 10 and reports a retry delay", async () => {
    const rows: FakeProduct[] = Array.from({ length: 10 }, (_, i) => ({
      vendor_id: "vendor-1",
      created_at: hoursAgo(1 + i * 0.1),
    }));
    const { client } = createFakeSupabase(rows);

    const quota = await getProductUploadQuota(client, "vendor-1");
    expect(quota.used).toBe(10);
    expect(quota.remaining).toBe(0);
    expect(quota.retryAfterSec).toBeGreaterThan(0);
  });

  it("reports zero remaining past the limit without going negative", async () => {
    const rows: FakeProduct[] = Array.from({ length: 14 }, () => ({
      vendor_id: "vendor-1",
      created_at: hoursAgo(2),
    }));
    const { client } = createFakeSupabase(rows);

    const quota = await getProductUploadQuota(client, "vendor-1");
    expect(quota.used).toBe(14);
    expect(quota.remaining).toBe(0);
  });

  it("fails closed when usage cannot be determined", async () => {
    const { client } = createFakeSupabase([], { error: { message: "boom" } });
    await expect(getProductUploadQuota(client, "vendor-1")).rejects.toThrow("boom");
  });

  it("queries the vendor's products over a 24h window, fetching one row", async () => {
    const { client, seen } = createFakeSupabase([]);
    await getProductUploadQuota(client, "vendor-7");

    expect(seen.vendorId).toBe("vendor-7");
    expect(seen.limit).toBe(1);

    const sinceMs = new Date(seen.since as string).getTime();
    const elapsedMs = Date.now() - sinceMs;
    // Allow a small tolerance for the two Date.now() calls straddling the await.
    expect(elapsedMs).toBeGreaterThanOrEqual(QUOTA_WINDOW_MS - 1000);
    expect(elapsedMs).toBeLessThanOrEqual(QUOTA_WINDOW_MS + 1000);
  });
});

describe("checkProductUploadQuota", () => {
  it("allows a seller who is under the limit", async () => {
    const { client } = createFakeSupabase([
      { vendor_id: "vendor-1", created_at: hoursAgo(3) },
    ]);

    const quota = await checkProductUploadQuota(client, "vendor-1");
    expect(quota.remaining).toBe(9);
    expect(quota.source).toBe("database");
  });

  it("refuses an 11th upload in the same window", async () => {
    const rows: FakeProduct[] = Array.from({ length: 10 }, (_, i) => ({
      vendor_id: "vendor-1",
      created_at: hoursAgo(20 - i),
    }));
    const { client } = createFakeSupabase(rows);

    const quota: QuotaStatus = await checkProductUploadQuota(client, "vendor-1");
    expect(quota.remaining).toBe(0);
    expect(quota.retryAfterSec).toBeGreaterThan(0);
  });

  it("frees a slot once the oldest upload leaves the window", async () => {
    // Nine recent uploads plus one that is 25h old (already outside the window)
    // is ten slots' worth of history but only nine live uploads.
    const rows: FakeProduct[] = [
      ...Array.from({ length: 9 }, (_, i) => ({
        vendor_id: "vendor-1",
        created_at: hoursAgo(i + 0.5),
      })),
      { vendor_id: "vendor-1", created_at: hoursAgo(25) },
    ];
    const { client } = createFakeSupabase(rows);

    const quota = await checkProductUploadQuota(client, "vendor-1");
    expect(quota.used).toBe(9);
    expect(quota.remaining).toBe(1);
  });

  it("fails closed when the count query errors", async () => {
    const { client } = createFakeSupabase([], { error: { message: "db down" } });
    await expect(checkProductUploadQuota(client, "vendor-1")).rejects.toThrow("db down");
  });
});

describe("QUOTA_EXCEEDED_MESSAGE", () => {
  it("is the documented client-facing message", () => {
    expect(QUOTA_EXCEEDED_MESSAGE).toBe("Daily product limit reached. Retry after 24h.");
  });
});
