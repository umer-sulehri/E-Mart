import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MONTHS = 6;

export async function GET() {
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
        { success: false, error: "Unauthorized" },
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

    const { data: productIds } = await supabase
      .from("products")
      .select("id")
      .eq("vendor_id", vendor.id);

    const ids = (productIds || []).map((p) => p.id);

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1), 1);
    const startStr = startDate.toISOString();

    const buckets: { month: string; label: string; revenue: number; orders: number }[] = [];
    for (let i = MONTHS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets.push({
        month: key,
        label: d.toLocaleString("en-PK", { month: "short" }),
        revenue: 0,
        orders: 0,
      });
    }

    if (ids.length > 0) {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("total, orders!inner(created_at, status)")
        .in("product_id", ids)
        .gte("orders.created_at", startStr);

      const valid = ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"];
      const rawItems = orderItems || [];
      for (const raw of rawItems) {
        const order = raw.orders?.[0] as { created_at?: string; status?: string } | undefined;
        const total = raw.total || 0;
        const created = order?.created_at ? new Date(order.created_at) : null;
        if (!created) continue;
        const key = `${created.getFullYear()}-${created.getMonth()}`;
        const bucket = buckets.find((b) => b.month === key);
        if (!bucket) continue;
        if (order) {
          bucket.orders += 1;
          if (valid.includes(order.status as string)) {
            bucket.revenue += total;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: buckets.map((b) => ({ label: b.label, revenue: b.revenue, orders: b.orders })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
