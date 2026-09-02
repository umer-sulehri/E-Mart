import { describe, it, expect } from "vitest";
import { parseCsv, parseCsvToObjects } from "../csv";

describe("parseCsv", () => {
  it("parses simple comma-separated values", () => {
    const rows = parseCsv("a,b,c\n1,2,3");
    expect(rows).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields with embedded commas", () => {
    const rows = parseCsv('name,description\n"Headphones, Pro","Great, sound"');
    expect(rows[1]).toEqual(["Headphones, Pro", "Great, sound"]);
  });

  it("un-escapes doubled quotes inside quoted fields", () => {
    const rows = parseCsv('msg\n"say ""hi"""');
    expect(rows[1]).toEqual(['say "hi"']);
  });

  it("handles CRLF line endings", () => {
    const rows = parseCsv("a,b\r\n1,2\r\n3,4");
    expect(rows).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("omits empty rows", () => {
    const rows = parseCsv("a,b\n\n1,2\n\n");
    expect(rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("parseCsvToObjects", () => {
  it("maps header row to snake_case keys", () => {
    const { rows, headers } = parseCsvToObjects(
      "Product Name,SKU,Price\nWidget,W-1,100\n"
    );
    expect(headers).toEqual(["product_name", "sku", "price"]);
    expect(rows).toEqual([
      { product_name: "Widget", sku: "W-1", price: "100" },
    ]);
  });

  it("returns empty objects for header-only input", () => {
    const { rows, headers } = parseCsvToObjects("name,sku");
    expect(headers).toEqual(["name", "sku"]);
    expect(rows).toEqual([]);
  });
});
