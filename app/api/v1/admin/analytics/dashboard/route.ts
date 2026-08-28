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
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    const [
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      monthlyRevenueResult,
      lastMonthRevenueResult,
      activeProducts,
      pendingOrders,
      deliveredOrders,
      recentOrders,
      recentUsers,
      pendingSellers,
      allOrders,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("vendors").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("total").in("status", ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"]).gte("created_at", startOfMonth),
      supabase.from("orders").select("total").in("status", ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"]).gte("created_at", startOfLastMonth).lte("created_at", endOfLastMonth),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered"),
      supabase.from("orders")
        .select("id, order_number, status, total, created_at, profiles(first_name, last_name, email)")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase.from("profiles")
        .select("id, first_name, last_name, email, role, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase.from("vendors")
        .select("id, name, slug, status, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase.from("orders").select("status"),
    ]);

    const monthlyRevenue = monthlyRevenueResult.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
    const lastMonthRevenue = lastMonthRevenueResult.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
    const revenueGrowth = lastMonthRevenue > 0
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    const orderStatusCounts = (allOrders.data || []).reduce<Record<string, number>>(
      (acc, o) => {
        const s = o.status || "pending";
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      {}
    );

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: totalUsers.count || 0,
        totalSellers: totalSellers.count || 0,
        totalProducts: totalProducts.count || 0,
        activeProducts: activeProducts.count || 0,
        totalOrders: totalOrders.count || 0,
        pendingOrders: pendingOrders.count || 0,
        deliveredOrders: deliveredOrders.count || 0,
        monthlyRevenue,
        lastMonthRevenue,
        revenueGrowth,
        recentOrders: recentOrders.data || [],
        recentUsers: recentUsers.data || [],
        pendingSellers: pendingSellers.data || [],
        orderStatusCounts,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
