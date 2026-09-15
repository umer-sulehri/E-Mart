import { describe, it, expect } from "vitest";
import { normalizeOrder, normalizeOrderItems } from "../orders";

describe("normalizeOrderItems", () => {
  it("returns an empty array for undefined", () => {
    expect(normalizeOrderItems(undefined)).toEqual([]);
  });

  it("returns an empty array for null", () => {
    expect(normalizeOrderItems(null as unknown as never[])).toEqual([]);
  });

  it("transforms snake_case to camelCase with numeric coercion", () => {
    const items = normalizeOrderItems([
      {
        id: "item-1",
        order_id: "order-1",
        product_id: "product-1",
        vendor_id: "vendor-1",
        product_name: "Organic Apples",
        product_image: "apples.jpg",
        quantity: "3",
        price: "150.50",
        total: "451.50",
        discount: "10",
        created_at: "2026-01-01",
        products: { id: "product-1" },
        vendors: { id: "vendor-1" },
      },
    ]);

    expect(items[0]).toMatchObject({
      id: "item-1",
      orderId: "order-1",
      productId: "product-1",
      vendorId: "vendor-1",
      productName: "Organic Apples",
      productImage: "apples.jpg",
      quantity: 3,
      unitPrice: 150.5,
      totalPrice: 451.5,
      discount: 10,
      createdAt: "2026-01-01",
    });
    expect(typeof items[0].quantity).toBe("number");
  });

  it("defaults discount to 0 when missing", () => {
    const items = normalizeOrderItems([
      { id: "i1", quantity: "1", price: "100", total: "100", discount: undefined },
    ]);
    expect(items[0].discount).toBe(0);
  });

  it("handles empty items array", () => {
    expect(normalizeOrderItems([])).toEqual([]);
  });
});

describe("normalizeOrder", () => {
  it("normalizes a full order with nested items", () => {
    const order = normalizeOrder({
      id: "order-1",
      order_number: "ORD-1001",
      user_id: "user-1",
      status: "pending",
      payment_status: "paid",
      payment_method: "card",
      subtotal: "1000",
      tax: "50",
      shipping_cost: "150",
      discount: "0",
      total: "1200",
      coupon_code: null,
      tracking_number: null,
      shipping_carrier: null,
      estimated_delivery: null,
      delivered_at: null,
      notes: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      order_items: [
        { id: "oi-1", quantity: "2", price: "500", total: "1000", discount: "0" },
      ],
    });

    expect(order.orderNumber).toBe("ORD-1001");
    expect(order.userId).toBe("user-1");
    expect(order.subtotal).toBe(1000);
    expect(order.total).toBe(1200);
    expect(Array.isArray(order.items)).toBe(true);
    expect(Array.isArray(order.order_items)).toBe(true);
    const firstItem = (order.items as Record<string, unknown>[])[0];
    expect(firstItem.quantity).toBe(2);
  });

  it("normalizes an order with no items", () => {
    const order = normalizeOrder({
      id: "order-2",
      order_number: "ORD-1002",
      user_id: "user-1",
      status: "delivered",
      payment_status: "paid",
      payment_method: "cod",
      subtotal: "500",
      tax: "25",
      shipping_cost: "0",
      discount: "50",
      total: "475",
      created_at: "2026-01-02T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
    });

    expect(order.items).toEqual([]);
    expect(order.order_items).toEqual([]);
  });

  it("keeps original snake_case keys for backward compatibility", () => {
    const order = normalizeOrder({
      id: "order-3",
      order_number: "ORD-1003",
      user_id: "user-1",
      status: "shipped",
      payment_status: "paid",
      payment_method: "card",
      subtotal: "100",
      tax: "5",
      shipping_cost: "20",
      discount: "0",
      total: "125",
      created_at: "2026-01-03T00:00:00Z",
      updated_at: "2026-01-03T00:00:00Z",
    });

    expect(order.order_number).toBe("ORD-1003");
    expect(order.payment_method).toBe("card");
  });
});