import { describe, it, expect } from "vitest";
import { mutateSettingBlob } from "../settings-merge";

type SettingsRequest = {
  select: (cols?: string) => {
    eq: (col: string, val: unknown) => {
      single: () => Promise<{
        data: { value: Record<string, unknown>; updated_at?: string } | null;
        error: { code?: string; message: string } | null;
      }>;
    };
  };
  update?: (patch: Record<string, unknown>) => {
    eq: (col: string, val: unknown) => {
      eq: (col2: string, val2: unknown) => {
        select: () => {
          single: () => Promise<{
            data: { value: Record<string, unknown>; updated_at?: string } | null;
            error: { code?: string; message: string } | null;
          }>;
        };
      };
    };
  };
  upsert?: (
    row: Record<string, unknown>,
    opts: Record<string, unknown>
  ) => {
    select: () => {
      single: () => Promise<{
        data: { value: Record<string, unknown>; updated_at?: string } | null;
        error: { code?: string; message: string } | null;
      }>;
    };
  };
};

function settingRow(value: Record<string, unknown>, updatedAt?: string) {
  return { value, updated_at: updatedAt ?? "2026-09-10T00:00:00.000000+00:00" };
}

describe("mutateSettingBlob", () => {
  it("creates the settings row when the key does not exist yet", async () => {
    let state: { value: Record<string, unknown>; updated_at?: string } | null = null;

    const supabase = {
      from: () => ({
        select: () => ({
          eq: (col: string, val: unknown) => ({
            single: async () => {
              if (!state) return { data: null, error: { code: "PGRST116", message: "no rows" } };
              if (col === "updated_at" && (state.updated_at ?? "") !== String(val)) {
                return { data: null, error: { code: "PGRST116", message: "stale" } };
              }
              return { data: state, error: null };
            },
          }),
        }),
        upsert: (row: Record<string, unknown>, opts: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              if (!state || opts.ignoreDuplicates) {
                const inserted = {
                  key: row.key as string,
                  value: row.value as Record<string, unknown>,
                  updated_at: "2026-09-10T00:00:00.000000+00:00",
                };
                state = inserted;
                return { data: inserted, error: null };
              }
              return { data: null, error: { code: "PGRST116", message: "ignored duplicate" } };
            },
          }),
        }),
      }),
    } as never;

    const outcome = await mutateSettingBlob(
      supabase,
      "translations",
      () => ({ ok: true, value: { en: { hello: "Hi" } } })
    );

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.saved.value).toEqual({ en: { hello: "Hi" } });
    }
  });

  it("updates an existing row and persists the merged value", async () => {
    let state: { value: Record<string, unknown>; updated_at?: string } | null =
      settingRow({ en: { hello: "Hi" } });

    const supabase = {
      from: () => ({
        select: () => ({
          eq: (col: string, val: unknown) => ({
            single: async () => {
              if (!state) return { data: null, error: { code: "PGRST116", message: "no rows" } };
              if (col === "updated_at" && (state.updated_at ?? "") !== String(val)) {
                return { data: null, error: { code: "PGRST116", message: "stale" } };
              }
              return { data: state, error: null };
            },
          }),
        }),
        update: (patch: Record<string, unknown>) => ({
          eq: (col: string, val: unknown) => ({
            eq: (col2: string, val2: unknown) => ({
              select: () => ({
                single: async () => {
                  if (
                    col2 === "updated_at" &&
                    (state?.updated_at ?? "") !== String(val2)
                  ) {
                    return { data: null, error: { code: "PGRST116", message: "stale" } };
                  }
                  state = {
                    value: patch.value as Record<string, unknown>,
                    updated_at: "2026-09-10T00:00:01.000000+00:00",
                  };
                  return { data: state, error: null };
                },
              }),
            }),
          }),
        }),
      }),
    } as never;

    const outcome = await mutateSettingBlob(
      supabase,
      "translations",
      (current) => ({
        ok: true,
        value: { en: { ...(current.en as Record<string, string>), bye: "Bye" } },
      })
    );

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.saved.value).toEqual({ en: { hello: "Hi", bye: "Bye" } });
    }
  });

  it("returns not-found outcome when the mutation reports it", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: settingRow({ links: [{ id: "a" }] }),
              error: null,
            }),
          }),
        }),
      }),
    } as never;

    const outcome = await mutateSettingBlob(
      supabase,
      "social_links",
      () => ({ ok: false, notFound: true })
    );

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error.status).toBe(404);
    }
  });

  it("retries on a stale updated_at conflict and succeeds on the next attempt", async () => {
    let readCount = 0;
    let updateCount = 0;
    let state: { value: Record<string, unknown>; updated_at?: string } | null =
      settingRow({ links: [{ id: "a" }] });

    const supabase = {
      from: () => ({
        select: () => ({
          eq: (col: string, val: unknown) => ({
            single: async () => {
              if (!state) return { data: null, error: { code: "PGRST116", message: "no rows" } };
              readCount++;
              if (col === "updated_at" && (state.updated_at ?? "") !== String(val)) {
                return { data: null, error: { code: "PGRST116", message: "stale" } };
              }
              return { data: state, error: null };
            },
          }),
        }),
        update: (patch: Record<string, unknown>) => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: async () => {
                  updateCount++;
                  if (updateCount === 1) {
                    // Simulate a concurrent write landing after our read.
                    state = {
                      value: { links: [{ id: "a" }, { id: "b" }] },
                      updated_at: "2026-09-10T00:00:00.500000+00:00",
                    };
                    return { data: null, error: { code: "PGRST116", message: "stale" } };
                  }
                  state = {
                    value: patch.value as Record<string, unknown>,
                    updated_at: "2026-09-10T00:00:01.000000+00:00",
                  };
                  return { data: state, error: null };
                },
              }),
            }),
          }),
        }),
      }),
    } as never;

    const outcome = await mutateSettingBlob(
      supabase,
      "social_links",
      (current) => {
        const links = current.links as Array<Record<string, unknown>> | undefined;
        return { ok: true, value: { links: [...(links || []), { id: "c" }] } };
      }
    );

    expect(outcome.ok).toBe(true);
    expect(readCount).toBe(2);
    if (outcome.ok) {
      expect(outcome.saved.value).toEqual({
        links: [{ id: "a" }, { id: "b" }, { id: "c" }],
      });
    }
  });
});