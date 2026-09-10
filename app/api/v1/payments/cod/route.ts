import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

interface CodConfirmRequest {
  orderId: string;
}

export async function POST(request: NextRequest) {
  try {
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

    const body: CodConfirmRequest = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, payment_method, payment_status, status")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.payment_status === "completed") {
      return NextResponse.json(
        { success: false, error: "Order already confirmed" },
        { status: 400 }
      );
    }

    if (order.payment_method !== "cod") {
      return NextResponse.json(
        { success: false, error: "This order is not a Cash on Delivery order" },
        { status: 400 }
      );
    }

    // Only a fresh order (still pending/confirmed/processing) may be confirmed
    // for COD; never regress an order that has already moved into fulfillment.
    if (!["pending", "confirmed", "processing"].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: "This order is already shipped or delivered and cannot be confirmed" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "pending",
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      logger.error("COD", "Failed to update order:", updateError.message);
      return NextResponse.json(
        { success: false, error: "Failed to confirm order" },
        { status: 500 }
      );
    }

    logger.info("COD", "Order", order.order_number, "confirmed for Cash on Delivery");

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        orderNumber: order.order_number,
        paymentStatus: "pending",
        status: "processing",
      },
      message: "Cash on Delivery order confirmed. Payment will be collected on delivery.",
    });
  } catch (error) {
    logger.error("COD", "Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}