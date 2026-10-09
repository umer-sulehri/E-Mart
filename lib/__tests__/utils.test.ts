import { describe, it, expect } from "vitest";
import {
  formatPrice,
  formatDate,
  slugify,
  truncate,
  generateOrderNumber,
  calculateDiscount,
  resolvePriceDisplay,
} from "../utils";

describe("slugify", () => {
  it("converts to lowercase and dash-separated", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("handles underscores and multiple spaces", () => {
    expect(slugify("  A   B_C  ")).toBe("a-b-c");
  });

  it("strips non word characters", () => {
    expect(slugify("Café & Bar!")).toBe("caf-bar");
  });
});

describe("calculateDiscount", () => {
  it("computes percentage discount", () => {
    expect(calculateDiscount(100, 75)).toBe(25);
  });

  it("returns 0 for invalid ranges", () => {
    expect(calculateDiscount(0, 75)).toBe(0);
    expect(calculateDiscount(100, 100)).toBe(0);
    expect(calculateDiscount(100, 120)).toBe(0);
  });
});

describe("truncate", () => {
  it("shortens text and appends ellipsis", () => {
    expect(truncate("abcdefghij", 5)).toBe("abcde...");
  });

  it("returns original when within length", () => {
    expect(truncate("abc", 5)).toBe("abc");
  });
});

describe("formatPrice", () => {
  it("formats PKR without decimals", () => {
    expect(formatPrice(24999)).toContain("24,999");
  });
});

describe("resolvePriceDisplay", () => {
  // The compare page rendered "Rs. 24,999Rs. 24,999" because every price cell
  // branched on `discountPrice` being present rather than on it being lower.
  it("never returns two equal numbers, so the duplicated price cannot render", () => {
    const { current, original } = resolvePriceDisplay(24999, 24999);
    expect(original).toBeNull();
    expect(current).toBe(24999);
  });

  it("hides the original when there is no discount price at all", () => {
    expect(resolvePriceDisplay(24999)).toEqual({
      current: 24999,
      original: null,
      discountPercent: 0,
    });
  });

  it("treats a null discount price as no discount", () => {
    expect(resolvePriceDisplay(24999, null).original).toBeNull();
  });

  it("hides the original when the discount price is higher than the price", () => {
    // A bad seller import can produce this. Showing it as a "was" price would
    // advertise a price rise as a discount.
    const result = resolvePriceDisplay(100, 120);
    expect(result).toEqual({ current: 100, original: null, discountPercent: 0 });
  });

  it("shows both numbers when the discount price is genuinely lower", () => {
    expect(resolvePriceDisplay(24999, 19999)).toEqual({
      current: 19999,
      original: 24999,
      discountPercent: 20,
    });
  });

  it("does not treat a zero price as discounted by a negative one", () => {
    expect(resolvePriceDisplay(0, -5).original).toBeNull();
  });

  it("reports the same percentage as calculateDiscount", () => {
    expect(resolvePriceDisplay(200, 150).discountPercent).toBe(
      calculateDiscount(200, 150)
    );
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    expect(formatDate("2026-01-15")).toContain("2026");
  });
});

describe("generateOrderNumber", () => {
  it("produces EM-YEAR-XXXXX format", () => {
    expect(generateOrderNumber()).toMatch(/^EM-\d{4}-\d{5}$/);
  });
});
