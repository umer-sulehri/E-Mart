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

    if (profile?.role !== "seller" && profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
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

    const { data: productIds } = await supabase
      .from("products")
      .select("id")
      .eq("vendor_id", vendor.id);

    const ids = (productIds || []).map((p) => p.id);

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalProductsSold = 0;

    if (ids.length > 0) {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("total, quantity, order_id, orders!inner(status)")
        .in("product_id", ids)
        .in("orders.status", ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"]);

      if (orderItems) {
        totalRevenue = orderItems.reduce((sum, item) => sum + item.total, 0);
        totalProductsSold = orderItems.reduce((sum, item) => sum + item.quantity, 0);

        const orderIds = new Set(orderItems.map((item) => item.order_id));
        totalOrders = orderIds.size || 0;
      }
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    let monthlyRevenue = 0;
    if (ids.length > 0) {
      const { data: monthlyItems } = await supabase
        .from("order_items")
        .select("total, orders!inner(created_at, status)")
        .in("product_id", ids)
        .in("orders.status", ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"])
        .gte("orders.created_at", startOfMonth);

      if (monthlyItems) {
        monthlyRevenue = monthlyItems.reduce((sum, item) => sum + item.total, 0);
      }
    }

    const { data: activeProducts } = await supabase
      .from("products")
      .select("id", { count: "exact" })
      .eq("vendor_id", vendor.id)
      .eq("is_active", true);

    const { data: totalProductCount } = await supabase
      .from("products")
      .select("id", { count: "exact" })
      .eq("vendor_id", vendor.id);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        monthlyRevenue,
        totalOrders,
        totalProductsSold,
        activeProducts: activeProducts?.length || 0,
        totalProducts: totalProductCount?.length || 0,
        commissionRate: vendor.commission_rate || 0,
        netEarnings: totalRevenue * (1 - (vendor.commission_rate || 0) / 100),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
