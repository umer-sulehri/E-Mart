import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", `payouts_${vendor.id}`)
      .single();

    const allPayouts =
      ((setting?.value as Record<string, unknown>)?.payouts as Array<Record<string, unknown>>) || [];

    const sorted = allPayouts.sort(
      (a, b) =>
        new Date(b.created_at as string).getTime() -
        new Date(a.created_at as string).getTime()
    );

    const paginated = sorted.slice(offset, offset + limit);
    const totalPaid = allPayouts
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + ((p.amount as number) || 0), 0);

    const { data: productIds } = await supabase
      .from("products")
      .select("id")
      .eq("vendor_id", vendor.id);

    const ids = (productIds || []).map((p) => p.id);

    let pendingBalance = 0;
    if (ids.length > 0) {
      const { data: earnings } = await supabase
        .from("order_items")
        .select("total, orders!inner(status)")
        .in("product_id", ids)
        .in("orders.status", ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"]);

      if (earnings) {
        pendingBalance = earnings.reduce((sum, item) => sum + (item.total || 0), 0) - totalPaid;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        payouts: paginated,
        summary: {
          total_paid: totalPaid,
          pending_balance: Math.max(0, pendingBalance),
          total_payouts: allPayouts.length,
        },
      },
      meta: {
        currentPage: page,
        totalPages: Math.ceil(allPayouts.length / limit),
        totalItems: allPayouts.length,
        itemsPerPage: limit,
        hasNextPage: page * limit < allPayouts.length,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
