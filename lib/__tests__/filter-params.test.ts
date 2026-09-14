import { describe, it, expect } from "vitest";
import {
  EMPTY_FILTERS,
  activeFilterCount,
  filtersFromSearchParams,
  filtersToApiParams,
  filtersToSearchParams,
  parseCsvParam,
} from "../filterParams";

function p(query: string): URLSearchParams {
  return new URLSearchParams(query);
}

describe("parseCsvParam", () => {
  it("splits a comma-separated multi-value param", () => {
    expect(parseCsvParam(p("categories=fruits,vegetables"), "categories", "category")).toEqual([
      "fruits",
      "vegetables",
    ]);
  });

  it("falls back to the legacy single-value key", () => {
    expect(parseCsvParam(p("category=fruits"), "categories", "category")).toEqual(["fruits"]);
  });

  it("prefers the new key over the legacy key", () => {
    expect(
      parseCsvParam(
        p("categories=fruits,vegetables&category=legacy"),
        "categories",
        "category"
      )
    ).toEqual(["fruits", "vegetables"]);
  });

  it("treats an empty new key as absent (legacy fallback)", () => {
    expect(parseCsvParam(p("categories=&category=legacy"), "categories", "category")).toEqual([
      "legacy",
    ]);
  });

  it("returns an empty array when neither key is present", () => {
    expect(parseCsvParam(p("minPrice=10"), "categories", "category")).toEqual([]);
  });

  it("filters empty segments", () => {
    expect(parseCsvParam(p("categories=fruits,,vegetables"), "categories", "category")).toEqual([
      "fruits",
      "vegetables",
    ]);
  });
});

describe("filtersFromSearchParams", () => {
  it("maps every filter to its URL field", () => {
    const filters = filtersFromSearchParams(
      p(
        "categories=fruits,vegetables&brands=acme&minPrice=10&maxPrice=50&minRating=4&inStock=true&featured=true"
      )
    );
    expect(filters).toEqual({
      categories: ["fruits", "vegetables"],
      minPrice: "10",
      maxPrice: "50",
      minRating: 4,
      brands: ["acme"],
      inStockOnly: true,
      featuredOnly: true,
    });
  });

  it("supports legacy singular category/brand params", () => {
    const filters = filtersFromSearchParams(p("category=fruits&brand=acme"));
    expect(filters.categories).toEqual(["fruits"]);
    expect(filters.brands).toEqual(["acme"]);
  });

  it("defaults missing filters to their empty values", () => {
    const filters = filtersFromSearchParams(p(""));
    expect(filters).toEqual(EMPTY_FILTERS);
  });

  it("coerces boolean params with exact string comparison", () => {
    const filters = filtersFromSearchParams(p("inStock=TRUE&featured=1"));
    expect(filters.inStockOnly).toBe(false);
    expect(filters.featuredOnly).toBe(false);
  });

  it("handles a non-numeric minRating gracefully", () => {
    expect(filtersFromSearchParams(p("minRating=abc")).minRating).toBe(0);
  });
});

describe("filtersToSearchParams", () => {
  it("round-trips a populated filter state", () => {
    const filters: typeof EMPTY_FILTERS = {
      categories: ["fruits", "vegetables"],
      minPrice: "10",
      maxPrice: "50",
      minRating: 4,
      brands: ["acme"],
      inStockOnly: true,
      featuredOnly: false,
    };
    const params = filtersToSearchParams(filters);
    expect(filtersFromSearchParams(params)).toEqual(filters);
  });

  it("drops empty filter values", () => {
    const params = filtersToSearchParams(EMPTY_FILTERS);
    const keys = Array.from(params.keys());
    for (const key of [
      "categories",
      "brands",
      "minPrice",
      "maxPrice",
      "minRating",
      "inStock",
      "featured",
    ]) {
      expect(keys).not.toContain(key);
    }
  });

  it("removes legacy category/brand keys and resets the page", () => {
    const params = filtersToSearchParams(
      { ...EMPTY_FILTERS, categories: ["fruits"] },
      p("category=old&brand=old&page=3&sort=price_asc")
    );
    expect(params.has("category")).toBe(false);
    expect(params.has("brand")).toBe(false);
    expect(params.has("page")).toBe(false);
    expect(params.get("categories")).toBe("fruits");
    expect(params.get("sort")).toBe("price_asc");
  });

  it("clearing all filters preserves sort and search", () => {
    const params = filtersToSearchParams(
      EMPTY_FILTERS,
      p("categories=fruits&minPrice=10&inStock=true&sort=rating&q=apples&page=2")
    );
    expect(params.get("sort")).toBe("rating");
    expect(params.get("q")).toBe("apples");
    expect(params.has("page")).toBe(false);
    for (const key of ["categories", "minPrice", "inStock"]) {
      expect(params.has(key)).toBe(false);
    }
  });
});

describe("filtersToApiParams", () => {
  it("serializes active filters for the products API", () => {
    const params = filtersToApiParams({
      categories: ["fruits", "vegetables"],
      minPrice: "10",
      maxPrice: "",
      minRating: 0,
      brands: ["acme"],
      inStockOnly: true,
      featuredOnly: false,
    });
    expect(params).toEqual({
      categories: "fruits,vegetables",
      minPrice: "10",
      brands: "acme",
      inStock: "true",
    });
  });

  it("returns no keys for an empty filter state", () => {
    expect(filtersToApiParams(EMPTY_FILTERS)).toEqual({});
  });
});

describe("activeFilterCount", () => {
  it("counts each active filter group once", () => {
    expect(
      activeFilterCount({
        categories: ["fruits", "vegetables"],
        minPrice: "10",
        maxPrice: "",
        minRating: 0,
        brands: [],
        inStockOnly: false,
        featuredOnly: false,
      })
    ).toBe(2);
  });

  it("counts price range as a single group", () => {
    expect(
      activeFilterCount({ ...EMPTY_FILTERS, minPrice: "1", maxPrice: "100" })
    ).toBe(1);
  });

  it("returns 0 for an empty filter state", () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
  });
});

describe("combined filters (AND semantics)", () => {
  const combinedQuery = "categories=fruits-vegetables,dairy-eggs&brands=emart&minPrice=1000&maxPrice=5000&minRating=4&inStock=true";

  it("reads every filter group from one URL", () => {
    const filters = filtersFromSearchParams(p(combinedQuery));
    expect(filters).toEqual({
      categories: ["fruits-vegetables", "dairy-eggs"],
      minPrice: "1000",
      maxPrice: "5000",
      minRating: 4,
      brands: ["emart"],
      inStockOnly: true,
      featuredOnly: false,
    });
  });

  it("serializes all groups into AND-style API params", () => {
    const filters = filtersFromSearchParams(p(combinedQuery));
    expect(filtersToApiParams(filters)).toEqual({
      categories: "fruits-vegetables,dairy-eggs",
      minPrice: "1000",
      maxPrice: "5000",
      minRating: "4",
      brands: "emart",
      inStock: "true",
    });
  });

  it("round-trips the combined query through URL -> state -> URL", () => {
    const filters = filtersFromSearchParams(p(combinedQuery));
    const serialized = filtersToSearchParams(filters);
    expect(filtersFromSearchParams(serialized)).toEqual(filters);
  });
});

describe("empty filter edge cases", () => {
  it("missing params never produce NaN or stale values", () => {
    const filters = filtersFromSearchParams(p("minPrice=abc&minRating=xyz&maxPrice="));
    expect(Number.isNaN(filters.minRating)).toBe(false);
    expect(filters.minRating).toBe(0);
    expect(filters.minPrice).toBe("abc");
    expect(filters.maxPrice).toBe("");
    expect(filters.categories).toEqual([]);
    expect(filters.brands).toEqual([]);
  });

  it("a single-category URL applies just that category", () => {
    const filters = filtersFromSearchParams(p("category=fruits-vegetables"));
    expect(filters.categories).toEqual(["fruits-vegetables"]);
    expect(filters.brands).toEqual([]);
  });
});