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

    if (!amount) {
      return NextResponse.json(
        { success: false, error: "amount is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("refunds").insert({
      order_id: id,
      amount,
      reason: reason || "Order refund",
      status: "processing",
      processed_by: user.id,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const { error: orderError } = await supabase
      .from("orders")
      .update({ status: "refunded" })
      .eq("id", id);

    if (orderError) {
      return NextResponse.json(
        { success: false, error: orderError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Refund initiated" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
