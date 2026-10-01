import { describe, it, expect } from "vitest";
import {
  computeCartMetrics,
  sumQuantities,
  migrateCartState,
  CART_STORAGE_VERSION,
} from "../cartMetrics";
import type { CartItem } from "../../types";

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
      stockQuantity: 10,
    },
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

describe("migrateCartState", () => {
  it("bumps the storage version so the migration runs once", () => {
    expect(CART_STORAGE_VERSION).toBe(2);
  });

  it("narrows a v1 line item to the snapshot the cart renders", () => {
    const migrated = migrateCartState({
      state: {},
      version: 1,
      items: [
        {
          id: "cart-p-1",
          productId: "p-1",
          quantity: 2,
          unitPrice: 10,
          totalPrice: 20,
          addedAt: "2026-01-01T00:00:00.000Z",
          product: {
            id: "p-1",
            name: "Blue Jeans",
            slug: "blue-jeans",
            description: "a long description the cart never renders",
            price: 10,
            sku: "SKU-1",
            stockQuantity: 7,
            images: ["/images/jeans.webp", "/images/jeans-2.webp"],
            category: { id: "c-1", name: "Clothing", slug: "clothing" },
            specifications: { fit: "slim" },
            createdAt: "2025-01-01",
            updatedAt: "2025-01-02",
          },
        },
      ],
    }) as { items: CartItem[] };

    expect(migrated.items).toHaveLength(1);
    expect(migrated.items[0].product).toEqual({
      id: "p-1",
      name: "Blue Jeans",
      slug: "blue-jeans",
      image: "/images/jeans.webp",
      stockQuantity: 7,
    });
    // Quantity/pricing survive, so the basket totals do not change.
    expect(migrated.items[0]).toMatchObject({
      quantity: 2,
      unitPrice: 10,
      totalPrice: 20,
    });
  });

  it("preserves an already-migrated item untouched", () => {
    const item = makeItem("p-9", 1, 10);
    const migrated = migrateCartState({ items: [item] }) as {
      items: CartItem[];
    };
    expect(migrated.items[0]).toEqual(item);
  });

  it("fills in defaults for a line item missing its product", () => {
    const migrated = migrateCartState({
      items: [
        {
          id: "cart-p-2",
          productId: "p-2",
          quantity: 1,
          unitPrice: 5,
          totalPrice: 5,
          addedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    }) as { items: CartItem[] };

    expect(migrated.items[0].product).toEqual({
      id: "p-2",
      name: "Product",
      slug: "",
      image: undefined,
      stockQuantity: 0,
    });
  });

  it("leaves unrelated or malformed state alone", () => {
    expect(migrateCartState(undefined)).toBeUndefined();
    expect(migrateCartState({ state: {}, version: 1 })).toEqual({
      state: {},
      version: 1,
    });
  });
});