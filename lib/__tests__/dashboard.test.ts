import { describe, it, expect } from "vitest";
import { getOrderItems, getQuickActionState } from "../dashboard";
import type { Order } from "../../types";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    orderNumber: "ORD-001",
    userId: "user-1",
    items: [
      {
        id: "item-1",
        orderId: "order-1",
        productId: "product-1",
        productName: "Apples",
        productImage: "/images/apples.jpg",
        quantity: 2,
        unitPrice: 300,
        totalPrice: 600,
        discount: 0,
        createdAt: "2026-09-01T00:00:00Z",
      },
    ],
    status: "pending",
    paymentStatus: "pending",
    paymentMethod: "cash_on_delivery",
    subtotal: 600,
    tax: 30,
    shippingCost: 150,
    discount: 0,
    total: 780,
    shippingAddress: {
      id: "addr-1",
      userId: "user-1",
      label: "Home",
      firstName: "Test",
      lastName: "User",
      phone: "+92 300 0000000",
      addressLine1: "1 Main St",
      city: "Lahore",
      state: "Punjab",
      postalCode: "54000",
      country: "PK",
      isDefault: true,
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-01T00:00:00Z",
    },
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

describe("getOrderItems", () => {
  it("returns order.items when present", () => {
    const order = makeOrder();
    expect(getOrderItems(order)).toHaveLength(1);
  });

  it("falls back to nested order_items", () => {
    const order = makeOrder({
      items: [],
    }) as unknown as Order & { order_items: Order["items"] };
    order.order_items = [
      {
        id: "item-2",
        orderId: "order-1",
        productId: "product-2",
        productName: "Milk",
        productImage: "/images/milk.jpg",
        quantity: 1,
        unitPrice: 180,
        totalPrice: 180,
        discount: 0,
        createdAt: "2026-09-01T00:00:00Z",
      },
    ];
    expect(getOrderItems(order)).toHaveLength(1);
  });
});

describe("getQuickActionState", () => {
  it("returns all-disabled state when there are no orders", () => {
    const state = getQuickActionState([]);
    expect(state).toEqual({
      lastOrder: null,
      hasOrders: false,
      canReorder: false,
      canTrack: false,
      canReview: false,
    });
  });

  it("enables re-order + track for an active (processing) order", () => {
    const state = getQuickActionState([makeOrder({ status: "processing" })]);
    expect(state.hasOrders).toBe(true);
    expect(state.canReorder).toBe(true);
    expect(state.canTrack).toBe(true);
    expect(state.canReview).toBe(false);
  });

  it("enables re-order for a delivered order but not tracking", () => {
    const state = getQuickActionState([makeOrder({ status: "delivered" })]);
    expect(state.canReorder).toBe(true);
    expect(state.canTrack).toBe(false);
  });

  it("disables re-order when the last order was cancelled", () => {
    const state = getQuickActionState([makeOrder({ status: "cancelled" })]);
    expect(state.canReorder).toBe(false);
    expect(state.canTrack).toBe(false);
  });

  it("enables review when a previous order was delivered", () => {
    const delivered = makeOrder({ id: "order-2", status: "delivered" });
    const state = getQuickActionState([delivered]);
    expect(state.canReview).toBe(true);
  });

  it("picks the most recent order as lastOrder", () => {
    const state = getQuickActionState([
      makeOrder({
        id: "most-recent",
        status: "pending",
        createdAt: "2026-09-10T00:00:00Z",
      }),
      makeOrder({
        id: "older",
        status: "delivered",
        createdAt: "2026-08-01T00:00:00Z",
      }),
    ]);
    expect(state.lastOrder?.id).toBe("most-recent");
  });

  it("disables re-order when the last order has no items", () => {
    const state = getQuickActionState([makeOrder({ items: [] })]);
    expect(state.canReorder).toBe(false);
  });
});