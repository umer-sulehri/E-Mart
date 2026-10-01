import { describe, it, expect } from "vitest";
import {
  applyFilterPatch,
  withInvalidatedPage,
  hrefWithQuery,
  filterHref,
  activeFilterKeys,
} from "../urlFilters";

describe("applyFilterPatch", () => {
  it("sets a filter", () => {
    expect(applyFilterPatch("", { status: "active" })).toBe("status=active");
  });

  it("removes a filter for null", () => {
    expect(applyFilterPatch("status=active", { status: null })).toBe("");
  });

  it("treats an empty string as unset, matching the select's 'all' option", () => {
    expect(applyFilterPatch("status=open", { status: "" })).toBe("");
  });

  it("overwrites an existing value rather than appending", () => {
    expect(applyFilterPatch("status=open", { status: "resolved" })).toBe(
      "status=resolved"
    );
  });

  it("clears every key in one pass", () => {
    // This is the "Reset All" regression: clearing filters one key at a time
    // rebuilt the query from stale params, so only the last survived.
    const query = "q=jeans&status=active&featured=true&isNew=true&onSale=true";
    expect(
      applyFilterPatch(query, {
        q: null,
        status: null,
        featured: null,
        isNew: null,
        onSale: null,
      })
    ).toBe("");
  });

  it("leaves untouched keys alone", () => {
    // A newly set key is appended, so `status` keeps its original position.
    expect(applyFilterPatch("status=active", { featured: "true" })).toBe(
      "status=active&featured=true"
    );
  });

  it("preserves multi-value seller slugs through the round trip", () => {
    const query = applyFilterPatch("sellers=alpha", { sellers: "alpha,beta" });
    expect(query).toBe("sellers=alpha%2Cbeta");
    expect(new URLSearchParams(query).get("sellers")).toBe("alpha,beta");
  });
});

describe("withInvalidatedPage", () => {
  it("drops the page so a filter change returns to page 1", () => {
    expect(withInvalidatedPage("page=4&status=active")).toBe("status=active");
  });

  it("keeps every other param", () => {
    expect(withInvalidatedPage("q=phone&page=7&featured=true")).toBe(
      "q=phone&featured=true"
    );
  });

  it("is a no-op when there is no page param", () => {
    expect(withInvalidatedPage("status=active")).toBe("status=active");
  });
});

describe("hrefWithQuery", () => {
  it("appends a query string", () => {
    expect(hrefWithQuery("/admin/offers", "status=active")).toBe(
      "/admin/offers?status=active"
    );
  });

  it("returns the bare pathname when the query is empty", () => {
    expect(hrefWithQuery("/admin/offers", "")).toBe("/admin/offers");
  });
});

describe("filterHref", () => {
  it("patches, drops the page, and resolves to an href", () => {
    expect(filterHref("/admin/offers", "page=3&status=open", { status: "resolved" })).toBe(
      "/admin/offers?status=resolved"
    );
  });

  it("does not emit a trailing question mark when everything is cleared", () => {
    expect(filterHref("/admin/offers", "status=open", { status: null })).toBe(
      "/admin/offers"
    );
  });

  it("survives a full reset without leaking any key", () => {
    const href = filterHref("/admin/offers", "page=2&q=a&status=active&sellers=x", {
      q: null,
      status: null,
      sellers: null,
    });
    expect(href).toBe("/admin/offers");
  });
});

describe("activeFilterKeys", () => {
  it("lists the keys currently set", () => {
    expect(activeFilterKeys("q=phone&status=open&featured=true").sort()).toEqual([
      "featured",
      "q",
      "status",
    ]);
  });

  it("excludes the keys passed as non-filter state", () => {
    expect(activeFilterKeys("q=phone&page=2&status=open", ["q", "page"])).toEqual([
      "status",
    ]);
  });

  it("returns nothing for an unfiltered query", () => {
    expect(activeFilterKeys("")).toEqual([]);
  });
});
