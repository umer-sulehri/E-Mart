import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id, status")
      .eq("id", id)
      .single();

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Permission denied" },
        { status: 403 }
      );
    }

    if (
      order.status !== "delivered" &&
      order.status !== "shipped" &&
      order.status !== "out_for_delivery"
    ) {
      return NextResponse.json(
        { success: false, error: "Order not eligible for return" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { reason } = body;

    const { error } = await supabase
      .from("orders")
      .update({ status: "return_requested", return_reason: reason })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Return request submitted",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
