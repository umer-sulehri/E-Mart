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

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1), 1);
    const startStr = startDate.toISOString();

    const { data: orders } = await supabase
      .from("orders")
      .select("id, total, created_at, status")
      .gte("created_at", startStr);

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

    const validStatuses = ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"];

    for (const order of orders || []) {
      const created = new Date(order.created_at);
      const key = `${created.getFullYear()}-${created.getMonth()}`;
      const bucket = buckets.find((b) => b.month === key);
      if (!bucket) continue;
      bucket.orders += 1;
      if (validStatuses.includes(order.status)) {
        bucket.revenue += order.total || 0;
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
