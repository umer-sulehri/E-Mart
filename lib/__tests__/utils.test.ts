import { describe, it, expect } from "vitest";
import {
  formatPrice,
  formatDate,
  slugify,
  truncate,
  generateOrderNumber,
  calculateDiscount,
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
