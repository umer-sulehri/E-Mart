import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, order_number, tracking_number, shipping_carrier, estimated_delivery, delivered_at, created_at, updated_at")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const statusTimeline = [
      { status: "pending", label: "Order Placed", completed: true, timestamp: order.created_at },
      { status: "confirmed", label: "Order Confirmed", completed: ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"].includes(order.status), timestamp: order.status === "confirmed" || ["processing", "shipped", "out_for_delivery", "delivered"].includes(order.status) ? order.updated_at : null },
      { status: "processing", label: "Processing", completed: ["processing", "shipped", "out_for_delivery", "delivered"].includes(order.status), timestamp: order.status === "processing" || ["shipped", "out_for_delivery", "delivered"].includes(order.status) ? order.updated_at : null },
      { status: "shipped", label: "Shipped", completed: ["shipped", "out_for_delivery", "delivered"].includes(order.status), timestamp: ["shipped", "out_for_delivery", "delivered"].includes(order.status) ? order.updated_at : null },
      { status: "out_for_delivery", label: "Out for Delivery", completed: ["out_for_delivery", "delivered"].includes(order.status), timestamp: order.status === "out_for_delivery" || order.status === "delivered" ? order.updated_at : null },
      { status: "delivered", label: "Delivered", completed: order.status === "delivered", timestamp: order.delivered_at },
    ];

    if (order.status === "cancelled") {
      statusTimeline.push({
        status: "cancelled",
        label: "Cancelled",
        completed: true,
        timestamp: order.updated_at,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.order_number,
        status: order.status,
        trackingNumber: order.tracking_number,
        shippingCarrier: order.shipping_carrier,
        estimatedDelivery: order.estimated_delivery,
        deliveredAt: order.delivered_at,
        timeline: statusTimeline,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
