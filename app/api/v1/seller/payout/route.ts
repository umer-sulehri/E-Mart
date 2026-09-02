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
      .select("id, commission_rate")
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

    // Payouts are stored in the seller_payouts table keyed by the seller's
    // profile id (user.id), which matches the RLS policy (auth.uid() = seller_id).
    const { data: payoutRows, error, count } = await supabase
      .from("seller_payouts")
      .select("*", { count: "exact" })
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const payouts = (payoutRows || []).map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      status: p.status as string,
      method: p.method,
      account_details: p.account_details,
      requested_at: p.created_at,
      processed_at: p.processed_at,
    }));

    const { data: totalData } = await supabase
      .from("seller_payouts")
      .select("amount, status")
      .eq("seller_id", user.id);

    const allPayouts = totalData || [];
    const totalPaid = allPayouts
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

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
        const grossTotal = earnings.reduce((sum, item) => sum + (item.total || 0), 0);
        const commissionRate = vendor?.commission_rate || 0;
        const netTotal = grossTotal * (1 - commissionRate / 100);
        pendingBalance = netTotal - totalPaid;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        payouts,
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
