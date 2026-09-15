import { describe, it, expect } from "vitest";
import {
  safeSearchPattern,
  safeOrTerm,
  escapeLikeWildcards,
  sanitizeSearchTerm,
} from "../search-safe";

describe("safeSearchPattern", () => {
  it("escapes LIKE wildcards in user input", () => {
    expect(safeSearchPattern("100% organic")).toBe("%100\\% organic%");
  });

  it("escapes underscore wildcards", () => {
    expect(safeSearchPattern("a_b")).toBe("%a\\_b%");
  });

  it("trims surrounding whitespace", () => {
    expect(safeSearchPattern("  olive oil  ")).toBe("%olive oil%");
  });

  it("caps input length at maxLength", () => {
    const value = "x".repeat(200);
    expect(safeSearchPattern(value, 10).length).toBeLessThanOrEqual(12);
  });

  it("handles empty strings", () => {
    expect(safeSearchPattern("")).toBe("%%");
  });
});

describe("safeOrTerm", () => {
  it("escapes commas for PostgREST or() filters", () => {
    expect(safeOrTerm("apples, oranges")).toBe("apples\\, oranges");
  });

  it("escapes parentheses", () => {
    expect(safeOrTerm("(organic)")).toBe("\\(organic\\)");
  });

  it("escapes backslashes before other characters", () => {
    expect(safeOrTerm("a\\b")).toBe("a\\\\b");
  });

  it("caps length at maxLength", () => {
    const term = safeOrTerm("y".repeat(120), 20);
    expect(term.length).toBeLessThanOrEqual(20);
  });

  it("returns empty for empty input", () => {
    expect(safeOrTerm("")).toBe("");
  });
});

describe("escapeLikeWildcards", () => {
  it("escapes percent signs", () => {
    expect(escapeLikeWildcards("50%")).toBe("50\\%");
  });

  it("escapes underscores", () => {
    expect(escapeLikeWildcards("first_name")).toBe("first\\_name");
  });

  it("escapes backslashes first", () => {
    expect(escapeLikeWildcards("a\\b%c_d")).toBe("a\\\\b\\%c\\_d");
  });

  it("leaves normal text untouched", () => {
    expect(escapeLikeWildcards("hello world")).toBe("hello world");
  });
});

describe("sanitizeSearchTerm", () => {
  it("trims whitespace", () => {
    expect(sanitizeSearchTerm("  apples  ")).toBe("apples");
  });

  it("caps max length", () => {
    expect(sanitizeSearchTerm("a".repeat(200), 25)).toBe("a".repeat(25));
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeSearchTerm("")).toBe("");
  });
});