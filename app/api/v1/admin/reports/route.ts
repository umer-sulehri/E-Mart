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

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "sales";
    const period = searchParams.get("period") || "30d";
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    const now = new Date();
    let fromDate: Date;

    if (startDate) {
      fromDate = new Date(startDate);
    } else {
      switch (period) {
        case "7d":
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    const toDate = endDate ? new Date(endDate) : now;
    const fromStr = fromDate.toISOString();
    const toStr = toDate.toISOString();

    let reportData: Record<string, unknown> = {};

    switch (type) {
      case "sales": {
        const { data: orders } = await supabase
          .from("orders")
          .select("id, total, status, created_at, payment_status")
          .gte("created_at", fromStr)
          .lte("created_at", toStr);

        const totalOrders = orders?.length || 0;
        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
        const completedOrders =
          orders?.filter((o) => o.status === "delivered" || o.status === "confirmed").length || 0;
        const cancelledOrders = orders?.filter((o) => o.status === "cancelled").length || 0;

        reportData = {
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          completed_orders: completedOrders,
          cancelled_orders: cancelledOrders,
          completion_rate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0,
          average_order_value: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
          period: { from: fromStr, to: toStr },
        };
        break;
      }
      case "products": {
        const { data: products } = await supabase
          .from("products")
          .select("id, status, is_active, stock_quantity, price, created_at")
          .gte("created_at", fromStr)
          .lte("created_at", toStr);

        const totalProducts = products?.length || 0;
        const activeProducts = products?.filter((p) => p.is_active).length || 0;
        const totalStock = products?.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) || 0;
        const lowStock = products?.filter((p) => (p.stock_quantity || 0) < 10 && p.is_active).length || 0;

        reportData = {
          total_products: totalProducts,
          active_products: activeProducts,
          inactive_products: totalProducts - activeProducts,
          total_stock: totalStock,
          low_stock_items: lowStock,
          period: { from: fromStr, to: toStr },
        };
        break;
      }
      case "users": {
        const { data: users } = await supabase
          .from("profiles")
          .select("id, role, created_at")
          .gte("created_at", fromStr)
          .lte("created_at", toStr);

        const totalUsers = users?.length || 0;
        const customers = users?.filter((u) => u.role === "customer").length || 0;
        const sellers = users?.filter((u) => u.role === "seller").length || 0;
        const admins = users?.filter((u) => u.role === "admin").length || 0;

        reportData = {
          total_users: totalUsers,
          new_customers: customers,
          new_sellers: sellers,
          new_admins: admins,
          period: { from: fromStr, to: toStr },
        };
        break;
      }
      case "revenue": {
        const { data: orders } = await supabase
          .from("orders")
          .select("id, total, created_at")
          .in("status", ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"])
          .gte("created_at", fromStr)
          .lte("created_at", toStr);

        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

        const { data: vendorPayments } = await supabase
          .from("vendors")
          .select("commission_rate");

        const avgCommission =
          vendorPayments && vendorPayments.length > 0
            ? vendorPayments.reduce((sum, v) => sum + (v.commission_rate || 0), 0) /
              vendorPayments.length
            : 10;

        const platformRevenue = totalRevenue * (avgCommission / 100);
        const sellerRevenue = totalRevenue - platformRevenue;

        reportData = {
          total_revenue: totalRevenue,
          platform_revenue: platformRevenue,
          seller_revenue: sellerRevenue,
          average_commission_rate: avgCommission.toFixed(1),
          period: { from: fromStr, to: toStr },
        };
        break;
      }
      default:
        return NextResponse.json(
          { success: false, error: "Invalid report type. Use: sales, products, users, revenue" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: { type, ...reportData } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
