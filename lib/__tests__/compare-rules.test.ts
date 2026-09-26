import { describe, it, expect } from "vitest";
import {
  MAX_COMPARE_ITEMS,
  canAddToCompare,
  remainingCompareSlots,
  type CompareCandidate,
} from "../compare-rules";

function item(id: string, categoryId: string): CompareCandidate {
  return { id, categoryId };
}

function listOf(count: number, categoryId = "cat-phones"): CompareCandidate[] {
  return Array.from({ length: count }, (_, i) => item(`p${i + 1}`, categoryId));
}

describe("MAX_COMPARE_ITEMS", () => {
  it("is 5", () => {
    expect(MAX_COMPARE_ITEMS).toBe(5);
  });
});

describe("canAddToCompare", () => {
  it("allows the very first product whatever its category", () => {
    expect(canAddToCompare([], item("p1", "cat-bakery"))).toEqual({ allowed: true });
  });

  it("allows a second product from the same category", () => {
    const decision = canAddToCompare([item("p1", "cat-phones")], item("p2", "cat-phones"));
    expect(decision).toEqual({ allowed: true });
  });

  it("rejects a product from a different category", () => {
    const decision = canAddToCompare([item("p1", "cat-phones")], item("p2", "cat-bakery"));
    expect(decision).toEqual({
      allowed: false,
      reason: "category-mismatch",
      activeCategoryId: "cat-phones",
    });
  });

  it("rejects a cross-category add even when the list has room", () => {
    const decision = canAddToCompare(listOf(3), item("p9", "cat-dairy"));
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("category-mismatch");
  });

  it("treats an empty category id as a real category, not as 'any'", () => {
    // ComparePageClient's inline search does not return a category id, so this
    // case is reachable. An uncategorised product must not be silently allowed
    // to join a categorised comparison.
    const decision = canAddToCompare([item("p1", "cat-phones")], item("p2", ""));
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("category-mismatch");
  });

  it("matches the first item's category, not the previous item's", () => {
    const items = [item("p1", "cat-phones"), item("p2", "cat-phones")];
    expect(canAddToCompare(items, item("p3", "cat-phones")).allowed).toBe(true);
    expect(canAddToCompare(items, item("p3", "cat-bakery")).allowed).toBe(false);
  });

  it("rejects a duplicate product", () => {
    const decision = canAddToCompare([item("p1", "cat-phones")], item("p1", "cat-phones"));
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.reason).toBe("duplicate");
      if (decision.reason === "duplicate") expect(decision.existing.id).toBe("p1");
    }
  });

  it("reports duplicate before limit, so toggling off still works when full", () => {
    const full = listOf(MAX_COMPARE_ITEMS);
    const decision = canAddToCompare(full, full[0]);
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("duplicate");
  });

  it("allows the 5th product and rejects the 6th", () => {
    expect(canAddToCompare(listOf(4), item("p5", "cat-phones")).allowed).toBe(true);

    const decision = canAddToCompare(listOf(5), item("p6", "cat-phones"));
    expect(decision).toEqual({ allowed: false, reason: "limit-reached", limit: 5 });
  });

  it("reports limit-reached before category-mismatch when both apply", () => {
    // Full AND wrong category: reporting the limit is the more actionable
    // message, since adding anything is impossible until a slot frees.
    const decision = canAddToCompare(listOf(5), item("p6", "cat-other"));
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("limit-reached");
  });
});

describe("remainingCompareSlots", () => {
  it("reports the full allowance when empty", () => {
    expect(remainingCompareSlots(0)).toBe(5);
  });

  it("counts down as items are added", () => {
    expect(remainingCompareSlots(3)).toBe(2);
    expect(remainingCompareSlots(4)).toBe(1);
  });

  it("never goes negative when over the limit", () => {
    expect(remainingCompareSlots(5)).toBe(0);
    expect(remainingCompareSlots(9)).toBe(0);
  });
});
