import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAdminLog } from "@/lib/audit";

export async function POST(
  request: NextRequest,
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Permission denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { amount, reason } = body;

    const refundAmount = Number(amount);
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, total, status, payment_status")
      .eq("id", id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const orderTotal = Number(order.total);

    // Sum pending/processing/completed refunds so an order can never be paid
    // out more than once, whether by retries or by mistake.
    const { data: existingRefunds, error: refundsError } = await supabase
      .from("refunds")
      .select("amount, status")
      .eq("order_id", id)
      .in("status", ["pending", "processing", "completed"]);

    if (refundsError) {
      return NextResponse.json(
        { success: false, error: "Failed to load existing refunds" },
        { status: 500 }
      );
    }

    const alreadyRefunded = (existingRefunds || []).reduce(
      (sum, refund) => sum + (Number(refund.amount) || 0),
      0
    );

    if (alreadyRefunded + refundAmount > orderTotal + 0.01) {
      return NextResponse.json(
        {
          success: false,
          error: `Refund exceeds the order total. Remaining refundable amount: ${Math.max(0, orderTotal - alreadyRefunded).toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    if (order.status === "cancelled") {
      return NextResponse.json(
        { success: false, error: "Cancelled orders cannot be refunded here" },
        { status: 400 }
      );
    }

    const { data: refund, error } = await supabase
      .from("refunds")
      .insert({
        order_id: id,
        amount: refundAmount,
        reason: typeof reason === "string" && reason.trim() ? reason.trim() : "Order refund",
        status: "processing",
        processed_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const isFullRefund = alreadyRefunded + refundAmount >= orderTotal - 0.01;

    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({
        status: isFullRefund ? "refunded" : order.status,
        payment_status: isFullRefund ? "refunded" : "partially_refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateOrderError) {
      return NextResponse.json(
        { success: false, error: updateOrderError.message },
        { status: 500 }
      );
    }

    await writeAdminLog(supabase, user.id, {
      action: "order.refund",
      entityType: "order",
      entityId: id,
      details: {
        orderNumber: order.order_number,
        amount: refundAmount,
        isFullRefund,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { refundId: refund?.id, amount: refundAmount, isFullRefund },
        message: isFullRefund ? "Full refund initiated" : "Partial refund initiated",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[v1/orders/[id]/refund] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
