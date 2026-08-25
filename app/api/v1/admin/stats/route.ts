import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      usersResult,
      sellersResult,
      productsResult,
      ordersResult,
      pendingOrdersResult,
      newUsersResult,
      monthlyOrdersResult,
      recentOrdersResult,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("vendors")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved"),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase.from("orders").select("id, total, status, created_at").not("status", "eq", "cancelled"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfDay),
      supabase
        .from("orders")
        .select("total")
        .in("status", ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"])
        .gte("created_at", startOfMonth),
      supabase
        .from("orders")
        .select(
          `id, order_number, status, total, created_at,
           profiles!orders_user_id_fkey(first_name, last_name)`
        )
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const totalUsers = usersResult.count || 0;
    const totalSellers = sellersResult.count || 0;
    const totalProducts = productsResult.count || 0;
    const totalOrders = ordersResult.data?.length || 0;
    const totalRevenue =
      ordersResult.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
    const pendingOrders = pendingOrdersResult.count || 0;
    const newUsersToday = newUsersResult.count || 0;
    const revenueThisMonth =
      monthlyOrdersResult.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      data: {
        total_users: totalUsers,
        total_sellers: totalSellers,
        total_products: totalProducts,
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        pending_orders: pendingOrders,
        new_users_today: newUsersToday,
        revenue_this_month: revenueThisMonth,
        recent_orders: recentOrdersResult.data || [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
