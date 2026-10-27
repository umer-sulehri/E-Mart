import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
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
      .select("id, status, payment_status, user_id, total, order_items(product_id, quantity)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (!["pending", "confirmed", "processing"].includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Order cannot be cancelled in its current status",
        },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .in("status", ["pending", "confirmed", "processing"])
      .select("id");

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // A concurrent request already cancelled it, so the caller must not restock
    // a second time.
    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order is no longer cancellable" },
        { status: 409 }
      );
    }

    // Buyers hold no UPDATE rights on products, so inventory restore uses the
    // admin client.
    const admin = createAdminClient();
    for (const item of order.order_items || []) {
      const { data: product } = await admin
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();

      if (product) {
        await admin
          .from("products")
          .update({ stock_quantity: product.stock_quantity + item.quantity })
          .eq("id", item.product_id);
      }
    }

    // A paid order must be refunded, not silently cancelled with the money kept.
    // The refunds table is admin-only under RLS, so use the service-role client
    // (ownership was verified above).
    if (order.payment_status === "completed") {
      await admin.from("refunds").insert({
        order_id: id,
        amount: order.total,
        reason: "Order cancelled by customer",
        status: "pending",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
