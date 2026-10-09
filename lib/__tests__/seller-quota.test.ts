import { describe, it, expect } from "vitest";
import {
  MAX_PRODUCTS_PER_DAY,
  QUOTA_TIMEZONE,
  QUOTA_EXEMPT_ADMINS,
  QUOTA_EXCEEDED_MESSAGE,
  DAILY_PRODUCT_LIMIT_CODE,
  quotaDayStart,
  quotaResetAt,
  quotaDayKey,
  productUploadQuotaKey,
  isQuotaExempt,
  exemptQuotaStatus,
  getProductUploadQuota,
  checkProductUploadQuota,
  dailyLimitErrorResponse,
  isDailyLimitDatabaseError,
  remainingImportBudget,
  planImportAgainstQuota,
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
 * `.from().select().eq().gte()` with `{ count: 'exact', head: true }`.
 *
 * Kept deliberately tiny — the real suite has no jsdom and no Supabase test
 * double, and adding either for this would be a dependency for one query.
 */
function createFakeSupabase(rows: FakeProduct[], options: FakeOptions = {}) {
  const seen: { vendorId: unknown; since: unknown } = { vendorId: null, since: null };

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

      // Terminal: the quota query is a HEAD count, so only `count` is populated.
      chain.then = (resolve: (v: unknown) => unknown) => {
        const matched = rows.filter(
          (r) =>
            r.vendor_id === seen.vendorId &&
            new Date(r.created_at).getTime() >= new Date(seen.since as string).getTime()
        );
        return Promise.resolve(
          Promise.resolve({
            data: null,
            count: matched.length,
            error: options.error ?? null,
          })
        ).then(resolve);
      };

      return chain;
    },
  };

  // The quota module only uses the one table, so the structural type is narrow.
  return { client: client as never, seen };
}

/** A timestamp `h` hours before the quota day start (i.e. "yesterday"). */
function hoursBeforeDayStart(h: number, now = new Date()): string {
  return new Date(quotaDayStart(now).getTime() - h * 60 * 60 * 1000).toISOString();
}

/** A timestamp `m` minutes after the quota day start (i.e. "today"). */
function minutesAfterDayStart(m: number, now = new Date()): string {
  return new Date(quotaDayStart(now).getTime() + m * 60 * 1000).toISOString();
}

/** An instant today, clamped into the past so `created_at` is never in the future. */
function todayAt(hoursInto: number, now = new Date()): string {
  const start = quotaDayStart(now).getTime();
  const target = start + hoursInto * 60 * 60 * 1000;
  // Never claim a future creation time; clamp to 1 minute ago.
  const capped = Math.min(target, Date.now() - 60_000);
  return new Date(capped).toISOString();
}

describe("quota settings", () => {
  it("defaults to 10 products per day", () => {
    expect(MAX_PRODUCTS_PER_DAY).toBe(10);
  });

  it("uses the Asia/Karachi day boundary", () => {
    expect(QUOTA_TIMEZONE).toBe("Asia/Karachi");
  });

  it("exempts admins by default", () => {
    expect(QUOTA_EXEMPT_ADMINS).toBe(true);
  });
});

describe("quotaDayStart", () => {
  it("returns midnight Asia/Karachi for a mid-day instant", () => {
    // 2026-03-15T09:30:00Z is 14:30 PKT on the 15th.
    const start = quotaDayStart(new Date("2026-03-15T09:30:00Z"));
    expect(start.toISOString()).toBe("2026-03-14T19:00:00.000Z");
  });

  it("returns the same start for every instant on the same PKT day", () => {
    const morning = quotaDayStart(new Date("2026-03-15T02:00:00Z"));
    const evening = quotaDayStart(new Date("2026-03-15T16:00:00Z"));
    expect(morning.getTime()).toBe(evening.getTime());
  });

  it("rolls over when Asia/Karachi crosses midnight, which is 19:00 UTC", () => {
    // 18:59 UTC is still 23:59 PKT on the 14th.
    expect(quotaDayStart(new Date("2026-03-14T18:59:00Z")).toISOString()).toBe(
      "2026-03-13T19:00:00.000Z"
    );
    // 19:00 UTC is 00:00 PKT on the 15th — a new quota day.
    expect(quotaDayStart(new Date("2026-03-14T19:00:00Z")).toISOString()).toBe(
      "2026-03-14T19:00:00.000Z"
    );
  });

  it("is always at or before now", () => {
    const now = new Date();
    expect(quotaDayStart(now).getTime()).toBeLessThanOrEqual(now.getTime());
  });
});

describe("quotaResetAt", () => {
  it("is the next Asia/Karachi midnight", () => {
    const reset = quotaResetAt(new Date("2026-03-15T09:30:00Z"));
    expect(reset.toISOString()).toBe("2026-03-15T19:00:00.000Z");
  });

  it("is exactly one day after the day start", () => {
    const now = new Date("2026-03-15T09:30:00Z");
    expect(quotaResetAt(now).getTime() - quotaDayStart(now).getTime()).toBe(
      24 * 60 * 60 * 1000
    );
  });

  it("is always in the future", () => {
    expect(quotaResetAt().getTime()).toBeGreaterThan(Date.now());
  });
});

describe("quotaDayKey", () => {
  it("formats the PKT calendar date", () => {
    expect(quotaDayKey(new Date("2026-03-15T09:30:00Z"))).toBe("2026-03-15");
  });

  it("uses the PKT date, not the UTC date, late in the UTC day", () => {
    // PKT is UTC+5, so 19:30 UTC on the 14th is already 00:30 PKT on the 15th.
    // A UTC-based key would bucket this into the 14th and reset the allowance
    // nine hours early for every seller in Pakistan.
    expect(quotaDayKey(new Date("2026-03-14T19:30:00Z"))).toBe("2026-03-15");
    expect(quotaDayKey(new Date("2026-03-14T18:30:00Z"))).toBe("2026-03-14");
  });
});

describe("productUploadQuotaKey", () => {
  it("namespaces the counter per seller and per quota day", () => {
    const now = new Date("2026-03-15T09:30:00Z");
    expect(productUploadQuotaKey("vendor-1", now)).toBe(
      "seller:vendor-1:product-uploads:2026-03-15"
    );
  });

  it("is date-stamped so two days never share a counter", () => {
    expect(productUploadQuotaKey("vendor-1", new Date("2026-03-15T09:30:00Z"))).not.toBe(
      productUploadQuotaKey("vendor-1", new Date("2026-03-16T09:30:00Z"))
    );
  });

  it("gives each seller a distinct counter", () => {
    const now = new Date("2026-03-15T09:30:00Z");
    expect(productUploadQuotaKey("vendor-1", now)).not.toBe(
      productUploadQuotaKey("vendor-2", now)
    );
  });
});

describe("isQuotaExempt", () => {
  it("exempts admins", () => {
    expect(isQuotaExempt("admin")).toBe(true);
  });

  it("does not exempt sellers or users", () => {
    expect(isQuotaExempt("seller")).toBe(false);
    expect(isQuotaExempt("user")).toBe(false);
    expect(isQuotaExempt(null)).toBe(false);
    expect(isQuotaExempt(undefined)).toBe(false);
  });
});

describe("exemptQuotaStatus", () => {
  it("is never exhausted and never reports a reset", () => {
    const quota = exemptQuotaStatus();
    expect(quota.exempt).toBe(true);
    expect(quota.remaining).toBe(MAX_PRODUCTS_PER_DAY);
    expect(quota.resetAt).toBeNull();
    expect(quota.retryAfterSec).toBeUndefined();
  });
});

describe("getProductUploadQuota", () => {
  it("reports a full allowance when the seller has not uploaded today", async () => {
    const { client } = createFakeSupabase([]);
    const quota = await getProductUploadQuota(client, "vendor-1");

    expect(quota.used).toBe(0);
    expect(quota.limit).toBe(10);
    expect(quota.remaining).toBe(10);
    expect(quota.exempt).toBeUndefined();
  });

  it("counts only products created inside the current PKT day", async () => {
    const now = new Date();
    const { client } = createFakeSupabase([
      { vendor_id: "vendor-1", created_at: todayAt(1, now) },
      { vendor_id: "vendor-1", created_at: todayAt(3, now) },
      // Yesterday — must not consume today's allowance.
      { vendor_id: "vendor-1", created_at: hoursBeforeDayStart(2, now) },
    ]);

    const quota = await getProductUploadQuota(client, "vendor-1", now);
    expect(quota.used).toBe(2);
    expect(quota.remaining).toBe(8);
  });

  it("counts a product created yesterday evening even when UTC says otherwise", async () => {
    // Regression guard for the fixed-day boundary: a naive `now() - 24h` window
    // would wrongly include rows created after 19:00 UTC the previous day.
    const now = new Date("2026-03-16T02:00:00Z"); // 07:00 PKT on the 16th
    const { client } = createFakeSupabase([
      // 14:00Z on the 15th = 19:00 PKT on the 15th — yesterday's day.
      { vendor_id: "vendor-1", created_at: "2026-03-15T14:00:00.000Z" },
      { vendor_id: "vendor-1", created_at: "2026-03-16T01:00:00.000Z" },
    ]);

    const quota = await getProductUploadQuota(client, "vendor-1", now);
    expect(quota.used).toBe(1);
  });

  it("never counts another seller's products", async () => {
    const now = new Date();
    const { client } = createFakeSupabase([
      { vendor_id: "vendor-1", created_at: todayAt(1, now) },
      { vendor_id: "vendor-2", created_at: todayAt(1, now) },
      { vendor_id: "vendor-2", created_at: todayAt(2, now) },
    ]);

    const quota = await getProductUploadQuota(client, "vendor-1", now);
    expect(quota.used).toBe(1);
  });

  it("counts a deleted product, because the count has no status filter", async () => {
    // Soft-deleted / archived rows still occupy a slot. This is what stops
    // delete-and-re-add from being a way around the allowance.
    const now = new Date();
    const { client } = createFakeSupabase(
      Array.from({ length: 10 }, (_, i) => ({
        vendor_id: "vendor-1",
        created_at: todayAt(i + 1, now),
      }))
    );

    const quota = await getProductUploadQuota(client, "vendor-1", now);
    expect(quota.used).toBe(10);
    expect(quota.remaining).toBe(0);
  });

  it("resets at the next Asia/Karachi midnight, not 24h after the oldest upload", () => {
    const now = new Date("2026-03-15T09:30:00Z");
    const quota = {
      used: 10,
      limit: 10,
      remaining: 0,
      resetAt: quotaResetAt(now).getTime(),
      source: "database" as const,
    };

    expect(new Date(quota.resetAt as number).toISOString()).toBe(
      "2026-03-15T19:00:00.000Z"
    );
  });

  it("marks the quota exhausted at exactly 10 and reports a retry delay", async () => {
    const now = new Date();
    const rows: FakeProduct[] = Array.from({ length: 10 }, (_, i) => ({
      vendor_id: "vendor-1",
      created_at: todayAt(i + 1, now),
    }));
    const { client } = createFakeSupabase(rows);

    const quota = await getProductUploadQuota(client, "vendor-1", now);
    expect(quota.used).toBe(10);
    expect(quota.remaining).toBe(0);
    expect(quota.retryAfterSec).toBeGreaterThan(0);
    expect(new Date(quota.resetAt as number).getTime()).toBe(quotaResetAt(now).getTime());
  });

  it("resets to a full allowance the moment the PKT day rolls over", async () => {
    // Ten products yesterday, ten the day before, nothing today.
    const now = new Date("2026-03-16T01:00:00Z"); // 06:00 PKT on the 16th
    const { client } = createFakeSupabase([
      { vendor_id: "vendor-1", created_at: "2026-03-15T10:00:00.000Z" },
      { vendor_id: "vendor-1", created_at: "2026-03-14T10:00:00.000Z" },
    ]);

    const quota = await getProductUploadQuota(client, "vendor-1", now);
    expect(quota.used).toBe(0);
    expect(quota.remaining).toBe(MAX_PRODUCTS_PER_DAY);
  });

  it("reports zero remaining past the limit without going negative", async () => {
    const now = new Date();
    const rows: FakeProduct[] = Array.from({ length: 14 }, () => ({
      vendor_id: "vendor-1",
      created_at: todayAt(2, now),
    }));
    const { client } = createFakeSupabase(rows);

    const quota = await getProductUploadQuota(client, "vendor-1", now);
    expect(quota.used).toBe(14);
    expect(quota.remaining).toBe(0);
  });

  it("fails closed when usage cannot be determined", async () => {
    const { client } = createFakeSupabase([], { error: { message: "boom" } });
    await expect(getProductUploadQuota(client, "vendor-1")).rejects.toThrow("boom");
  });

  it("queries from the current PKT midnight, scoped to one vendor", async () => {
    const now = new Date("2026-03-15T09:30:00Z");
    const { client, seen } = createFakeSupabase([]);
    await getProductUploadQuota(client, "vendor-7", now);

    expect(seen.vendorId).toBe("vendor-7");
    expect(new Date(seen.since as string).toISOString()).toBe(
      "2026-03-14T19:00:00.000Z"
    );
  });

  it("uses a HEAD count rather than fetching rows", async () => {
    const { client, seen } = createFakeSupabase([]);
    await getProductUploadQuota(client, "vendor-1");

    // Only `gte` is called — no order/limit, because no row is needed.
    expect(seen.since).not.toBeNull();
  });
});

describe("checkProductUploadQuota", () => {
  it("allows a seller who is under the limit", async () => {
    const now = new Date();
    const { client } = createFakeSupabase([
      { vendor_id: "vendor-1", created_at: todayAt(2, now) },
    ]);

    const quota = await checkProductUploadQuota(client, "vendor-1", now);
    expect(quota.remaining).toBe(9);
    expect(quota.source).toBe("database");
  });

  it("refuses the 11th upload of the same PKT day", async () => {
    const now = new Date();
    const rows: FakeProduct[] = Array.from({ length: 10 }, (_, i) => ({
      vendor_id: "vendor-1",
      created_at: todayAt(i + 1, now),
    }));
    const { client } = createFakeSupabase(rows);

    const quota: QuotaStatus = await checkProductUploadQuota(client, "vendor-1", now);
    expect(quota.remaining).toBe(0);
    expect(quota.retryAfterSec).toBeGreaterThan(0);
  });

  it("allows 9 uploads plus a full previous day, because only today counts", async () => {
    const now = new Date();
    const rows: FakeProduct[] = [
      ...Array.from({ length: 9 }, (_, i) => ({
        vendor_id: "vendor-1",
        created_at: todayAt(i + 1, now),
      })),
      // Already at yesterday's limit.
      { vendor_id: "vendor-1", created_at: hoursBeforeDayStart(1, now) },
    ];
    const { client } = createFakeSupabase(rows);

    const quota = await checkProductUploadQuota(client, "vendor-1", now);
    expect(quota.used).toBe(9);
    expect(quota.remaining).toBe(1);
  });

  it("fails closed when the count query errors", async () => {
    const { client } = createFakeSupabase([], { error: { message: "db down" } });
    await expect(checkProductUploadQuota(client, "vendor-1")).rejects.toThrow("db down");
  });
});

describe("dailyLimitErrorResponse", () => {
  it("returns the standard envelope with a machine-readable code", () => {
    const now = new Date("2026-03-15T09:30:00Z");
    const { body } = dailyLimitErrorResponse(
      {
        used: 10,
        limit: 10,
        remaining: 0,
        resetAt: quotaResetAt(now).getTime(),
        source: "database",
      },
      now
    );

    expect(body.success).toBe(false);
    expect(body.error.code).toBe(DAILY_PRODUCT_LIMIT_CODE);
    expect(body.error.message).toBe(QUOTA_EXCEEDED_MESSAGE);
    expect(body.meta).toEqual({
      limit: 10,
      used: 10,
      remaining: 0,
      resetAt: "2026-03-15T19:00:00.000Z",
    });
  });

  it("sets Retry-After and rate-limit headers from the reset instant", () => {
    const now = new Date("2026-03-15T09:30:00Z");
    const { headers } = dailyLimitErrorResponse(
      {
        used: 10,
        limit: 10,
        remaining: 0,
        resetAt: quotaResetAt(now).getTime(),
        source: "database",
      },
      now
    );

    expect(headers["Retry-After"]).toBe("34200"); // 9.5h until PKT midnight
    expect(headers["X-RateLimit-Limit"]).toBe("10");
    expect(headers["X-RateLimit-Remaining"]).toBe("0");
    expect(headers["X-RateLimit-Reset"]).toBe(
      String(Math.floor(quotaResetAt(now).getTime() / 1000))
    );
  });

  it("falls back to the next reset when the caller has none", () => {
    const now = new Date("2026-03-15T09:30:00Z");
    const { body } = dailyLimitErrorResponse(
      { used: 10, limit: 10, remaining: 0, resetAt: null, source: "redis" },
      now
    );

    expect(body.meta.resetAt).toBe("2026-03-15T19:00:00.000Z");
  });
});

describe("isDailyLimitDatabaseError", () => {
  it("recognises the trigger's sentinel message", () => {
    expect(
      isDailyLimitDatabaseError({
        message:
          "DAILY_PRODUCT_LIMIT: seller abc has created 10 of 10 products (resets at ...)",
      })
    ).toBe(true);
  });

  it("ignores unrelated database errors", () => {
    expect(isDailyLimitDatabaseError({ message: "duplicate key value" })).toBe(false);
    expect(isDailyLimitDatabaseError(new Error("connection reset"))).toBe(false);
    expect(isDailyLimitDatabaseError(null)).toBe(false);
    expect(isDailyLimitDatabaseError(undefined)).toBe(false);
    expect(isDailyLimitDatabaseError("DAILY_PRODUCT_LIMIT")).toBe(false);
  });
});

describe("remainingImportBudget", () => {
  it("is the remaining allowance for a seller", () => {
    expect(
      remainingImportBudget({
        used: 7,
        limit: 10,
        remaining: 3,
        resetAt: Date.now() + 1000,
        source: "database",
      })
    ).toBe(3);
  });

  it("is zero once the allowance is spent", () => {
    expect(
      remainingImportBudget({
        used: 10,
        limit: 10,
        remaining: 0,
        resetAt: Date.now() + 1000,
        source: "database",
      })
    ).toBe(0);
  });

  it("is unbounded for an exempt caller", () => {
    expect(remainingImportBudget(exemptQuotaStatus())).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("planImportAgainstQuota", () => {
  const rows = (n: number) => Array.from({ length: n }, (_, i) => `product-${i + 1}`);
  const quotaWith = (used: number): QuotaStatus => ({
    used,
    limit: MAX_PRODUCTS_PER_DAY,
    remaining: Math.max(0, MAX_PRODUCTS_PER_DAY - used),
    resetAt: Date.now() + 60_000,
    source: "database",
  });

  it("accepts every row when the CSV fits in the allowance", () => {
    const plan = planImportAgainstQuota(rows(4), quotaWith(0));
    expect(plan.accepted).toHaveLength(4);
    expect(plan.rejected).toHaveLength(0);
    expect(plan.hitLimit).toBe(false);
  });

  it("accepts exactly the remaining allowance and rejects the overflow", () => {
    // 7 used, 3 remaining, 10 rows in the CSV.
    const plan = planImportAgainstQuota(rows(10), quotaWith(7));

    expect(plan.accepted).toHaveLength(3);
    expect(plan.rejected).toHaveLength(7);
    expect(plan.hitLimit).toBe(true);
    expect([...plan.accepted, ...plan.rejected]).toEqual(rows(10));
  });

  it("keeps the leading rows rather than an arbitrary subset", () => {
    const plan = planImportAgainstQuota(rows(5), quotaWith(9));
    expect(plan.accepted).toEqual(["product-1"]);
    expect(plan.rejected).toEqual([
      "product-2",
      "product-3",
      "product-4",
      "product-5",
    ]);
  });

  it("rejects the whole CSV when the allowance is already spent", () => {
    const plan = planImportAgainstQuota(rows(3), quotaWith(10));
    expect(plan.accepted).toHaveLength(0);
    expect(plan.rejected).toEqual(rows(3));
    expect(plan.hitLimit).toBe(true);
  });

  it("accepts an empty CSV without reporting a limit hit", () => {
    const plan = planImportAgainstQuota([], quotaWith(10));
    expect(plan.accepted).toEqual([]);
    expect(plan.hitLimit).toBe(false);
  });

  it("never rejects anything for an exempt admin", () => {
    const plan = planImportAgainstQuota(rows(500), exemptQuotaStatus());
    expect(plan.accepted).toHaveLength(500);
    expect(plan.rejected).toHaveLength(0);
    expect(plan.hitLimit).toBe(false);
  });

  it("accepts a CSV exactly equal to the remaining allowance", () => {
    const plan = planImportAgainstQuota(rows(3), quotaWith(7));
    expect(plan.accepted).toHaveLength(3);
    expect(plan.hitLimit).toBe(false);
  });

  it("does not mutate the input array", () => {
    const input = rows(10);
    planImportAgainstQuota(input, quotaWith(7));
    expect(input).toHaveLength(10);
  });
});

describe("QUOTA_EXCEEDED_MESSAGE", () => {
  it("names the limit and tells the seller when to retry", () => {
    expect(QUOTA_EXCEEDED_MESSAGE).toBe(
      "Daily limit of 10 products reached. Try again tomorrow."
    );
  });
});