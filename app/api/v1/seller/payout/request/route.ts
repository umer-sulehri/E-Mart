import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "seller" && profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Seller access required" },
        { status: 403 }
      );
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id, commission_rate")
      .eq("user_id", user.id)
      .single();

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { amount, method, account_details } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "A positive amount is required" },
        { status: 400 }
      );
    }

    const validMethods = ["bank", "easypaisa", "jazzcash"];
    if (!method || !validMethods.includes(method)) {
      return NextResponse.json(
        { success: false, error: `method must be one of: ${validMethods.join(", ")}` },
        { status: 400 }
      );
    }

    if (!account_details || typeof account_details !== "object") {
      return NextResponse.json(
        { success: false, error: "account_details object is required" },
        { status: 400 }
      );
    }

    const { data: productIds } = await supabase
      .from("products")
      .select("id")
      .eq("vendor_id", vendor.id);

    const ids = (productIds || []).map((p) => p.id);

    let totalEarnings = 0;
    if (ids.length > 0) {
      const { data: earnings } = await supabase
        .from("order_items")
        .select("total, orders!inner(status)")
        .in("product_id", ids)
        .in("orders.status", ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"]);

      if (earnings) {
        totalEarnings = earnings.reduce((sum, item) => sum + (item.total || 0), 0);
      }
    }

    const settingKey = `payouts_${vendor.id}`;
    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", settingKey)
      .single();

    const existingPayouts =
      ((setting?.value as Record<string, unknown>)?.payouts as Array<Record<string, unknown>>) || [];
    const totalPaid = existingPayouts
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + ((p.amount as number) || 0), 0);

    const availableBalance = totalEarnings - totalPaid;

    if (amount > availableBalance) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient balance. Available: ${availableBalance.toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    const payout = {
      id: crypto.randomUUID(),
      vendor_id: vendor.id,
      amount,
      method,
      account_details,
      status: "pending",
      requested_at: new Date().toISOString(),
    };

    const updatedPayouts = [...existingPayouts, payout];

    const { error } = await supabase
      .from("settings")
      .upsert(
        { key: settingKey, value: { payouts: updatedPayouts } },
        { onConflict: "key" }
      );

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: payout,
        message: "Payout request submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
