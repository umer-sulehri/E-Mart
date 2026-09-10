import { describe, it, expect } from "vitest";
import { computeCartMetrics, sumQuantities } from "../cartMetrics";
import type { CartItem, Product } from "../../types";

function makeItem(
  productId: string,
  quantity: number,
  totalPrice: number
): CartItem {
  const unitPrice = totalPrice / quantity;
  return {
    id: `cart-${productId}`,
    productId,
    product: {
      id: productId,
      name: "Test Product",
      slug: productId,
      description: "desc",
      price: unitPrice,
      stockQuantity: 10,
      sku: "SKU",
      categoryId: "cat-1",
      rating: 4,
      reviewCount: 1,
      isActive: true,
      isFeatured: false,
      isNew: false,
      images: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    } as unknown as Product,
    quantity,
    unitPrice,
    totalPrice,
    addedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("computeCartMetrics", () => {
  it("returns zeros for an empty cart", () => {
    expect(computeCartMetrics([])).toEqual({
      uniqueItemCount: 0,
      totalQuantity: 0,
      subtotal: 0,
    });
  });

  it("counts unique line items (not total units)", () => {
    const items = [
      makeItem("p-1", 3, 30),
      makeItem("p-2", 1, 10),
    ];
    const metrics = computeCartMetrics(items);
    expect(metrics.uniqueItemCount).toBe(2);
    expect(metrics.totalQuantity).toBe(4);
    expect(metrics.subtotal).toBe(40);
  });

  it("aggregates quantity and price across multiple lines", () => {
    const items = [
      makeItem("p-1", 2, 20),
      makeItem("p-2", 5, 50),
      makeItem("p-3", 1, 10),
    ];
    const metrics = computeCartMetrics(items);
    // The store merges lines by productId, so every line is a unique item.
    expect(metrics.uniqueItemCount).toBe(3);
    expect(metrics.totalQuantity).toBe(8);
    expect(metrics.subtotal).toBe(80);
  });

  it("does not mutate the input array", () => {
    const items = [makeItem("p-1", 1, 10)];
    computeCartMetrics(items);
    expect(items).toHaveLength(1);
  });
});

describe("sumQuantities", () => {
  it("sums quantities across all line items", () => {
    expect(
      sumQuantities([makeItem("p-1", 2, 20), makeItem("p-2", 3, 30)])
    ).toBe(5);
  });

  it("returns 0 for an empty cart", () => {
    expect(sumQuantities([])).toBe(0);
  });
});