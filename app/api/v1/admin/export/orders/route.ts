import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv, downloadCsvResponse } from "@/lib/csv";
import { rateLimitByIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const limit = rateLimitByIp(request, 30, 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
      );
    }

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

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        "order_number, status, payment_status, payment_method, subtotal, shipping_cost, tax, discount, total, created_at, profiles!inner(first_name, last_name, email)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const rows = (orders || []).map((o: any) => {
      const customer = Array.isArray(o.profiles) ? o.profiles[0] : o.profiles;
      return {
        Order_Number: o.order_number,
        Customer: `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim(),
        Email: customer?.email ?? "",
        Status: o.status,
        Payment_Status: o.payment_status,
        Payment_Method: o.payment_method,
        Subtotal: o.subtotal,
        Shipping: o.shipping_cost,
        Tax: o.tax,
        Discount: o.discount ?? "",
        Total: o.total,
        Created_At: o.created_at,
      };
    });

    return downloadCsvResponse(toCsv(rows), `orders-${Date.now()}.csv`);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
