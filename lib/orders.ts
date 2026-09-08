type RawRow = Record<string, unknown>;

export function normalizeOrderItems(orderItems: RawRow[] | undefined): RawRow[] {
  return (orderItems || []).map((i) => ({
    id: i.id,
    orderId: i.order_id,
    productId: i.product_id,
    vendorId: i.vendor_id,
    productName: i.product_name,
    productImage: i.product_image,
    quantity: Number(i.quantity),
    unitPrice: Number(i.price),
    totalPrice: Number(i.total),
    discount: Number(i.discount || 0),
    createdAt: i.created_at,
    product: i.products,
    vendor: i.vendors,
  }));
}

export function normalizeOrder(order: RawRow): RawRow {
  const rawItems = (order.order_items as RawRow[] | undefined) || [];
  const items = normalizeOrderItems(rawItems);
  return {
    ...order,
    id: order.id,
    orderNumber: order.order_number,
    userId: order.user_id,
    items,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    shippingCost: Number(order.shipping_cost),
    discount: Number(order.discount),
    total: Number(order.total),
    couponCode: order.coupon_code,
    trackingNumber: order.tracking_number,
    shippingCarrier: order.shipping_carrier,
    estimatedDelivery: order.estimated_delivery,
    deliveredAt: order.delivered_at,
    notes: order.notes,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    // Keep the raw snake_case items as well so consumers that read the
    // joined products/vendors (reviews, write-review) keep working.
    order_items: rawItems,
  };
}
