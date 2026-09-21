import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = ["pending", "processing", "completed", "failed"];

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

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;
    const status = searchParams.get("status");

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `status must be one of ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    let query = supabase
      .from("seller_payouts")
      .select(
        "id, seller_id, amount, method, account_details, status, notes, processed_at, created_at, updated_at",
        { count: "exact" }
      );

    if (status) {
      query = query.eq("status", status);
    }

    const {
      data: payoutRows,
      error,
      count,
    } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const rows = (payoutRows || []).map((p) => ({
      id: p.id,
      seller_id: p.seller_id,
      amount: Number(p.amount || 0),
      method: p.method,
      account_details: p.account_details,
      status: p.status,
      notes: p.notes,
      processed_at: p.processed_at,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    const sellerIds = Array.from(
      new Set((payoutRows || []).map((p) => p.seller_id).filter(Boolean))
    );

    const sellerNames: Record<string, string> = {};
    if (sellerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", sellerIds);

      if (profiles) {
        profiles.forEach((prof) => {
          const name = [prof.first_name, prof.last_name]
            .filter(Boolean)
            .join(" ")
            .trim();
          sellerNames[prof.id] = name || prof.email || "Seller";
        });
      }
    }

    const { data: summaryRows } = await supabase
      .from("seller_payouts")
      .select("amount, status");

    let totalRequested = 0;
    let totalPaid = 0;
    let pendingBalance = 0;

    (summaryRows || []).forEach((p) => {
      const amount = Number(p.amount || 0);
      totalRequested += amount;
      if (p.status === "completed") {
        totalPaid += amount;
      } else if (p.status === "pending" || p.status === "processing") {
        pendingBalance += amount;
      }
    });

    const rowsWithSellers = rows.map((row) => ({
      ...row,
      seller_name: sellerNames[row.seller_id] || "Seller",
    }));

    return NextResponse.json({
      success: true,
      data: rowsWithSellers,
      summary: {
        total_requested: totalRequested,
        total_paid: totalPaid,
        pending_balance: pendingBalance,
      },
      meta: {
        current_page: page,
        total_pages: Math.max(1, Math.ceil((count || 0) / limit)),
        total_items: count || 0,
        items_per_page: limit,
        has_next_page: offset + limit < (count || 0),
      },
    });
  } catch (error) {
    console.error("[v1/admin/payouts GET] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
