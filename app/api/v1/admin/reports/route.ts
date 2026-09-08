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

        // Compare against the 7 days preceding the window for change %.
        const prevFrom = new Date(fromDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: prevOrders } = await supabase
          .from("orders")
          .select("id, total, created_at")
          .gte("created_at", prevFrom)
          .lt("created_at", fromStr);
        const prevRevenue = prevOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
        const prevCount = prevOrders?.length || 0;
        const revenueChange = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;
        const ordersChange = prevCount > 0 ? Math.round(((totalOrders - prevCount) / prevCount) * 100) : 0;

        // Daily revenue grouped by calendar day.
        const dayMap = new Map<string, number>();
        for (const o of orders || []) {
          const day = new Date(o.created_at).toISOString().slice(0, 10);
          dayMap.set(day, (dayMap.get(day) || 0) + (o.total || 0));
        }
        const dailyRevenue = [...dayMap.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, amount]) => ({ date, amount }));

        // Top products by revenue (from paid order items, joined with product name).
        let topProducts: { name: string; revenue: number; quantity: number }[] = [];
        try {
          const { data: items } = await supabase
            .from("order_items")
            .select(
              "total, quantity, product_id, products!inner(name)"
            );
          const agg = new Map<
            string,
            { name: string; revenue: number; quantity: number }
          >();
          for (const it of items || []) {
            const pid = it.product_id;
            const pname = Array.isArray(it.products)
              ? it.products[0]?.name
              : (it.products as any)?.name;
            if (!pid || !pname) continue;
            const cur = agg.get(pid) || {
              name: pname,
              revenue: 0,
              quantity: 0,
            };
            cur.revenue += it.total || 0;
            cur.quantity += it.quantity || 0;
            agg.set(pid, cur);
          }
          topProducts = [...agg.values()]
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
            .map((p) => ({
              name: p.name,
              revenue: Math.round(p.revenue),
              quantity: p.quantity,
            }));
        } catch {
          topProducts = [];
        }

        reportData = {
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          completed_orders: completedOrders,
          cancelled_orders: cancelledOrders,
          completion_rate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0,
          average_order_value: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
          revenue_change: revenueChange,
          orders_change: ordersChange,
          daily_revenue: dailyRevenue,
          top_products: topProducts,
          period: { from: fromStr, to: toStr },
        };
        break;
      }
      case "products": {
        const { data: products } = await supabase
          .from("products")
          .select(
            "id, status, is_active, stock_quantity, price, created_at, rating, review_count, name, category_id, categories!products_category_id_fkey(name)"
          )
          .gte("created_at", fromStr)
          .lte("created_at", toStr);

        const totalProducts = products?.length || 0;
        const activeProducts = products?.filter((p) => p.is_active).length || 0;
        const totalStock = products?.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) || 0;
        const lowStock = products?.filter((p) => (p.stock_quantity || 0) < 10 && p.is_active).length || 0;

        let lowStockAlerts: { name: string; stock: number; threshold: number }[] = [];
        let topRated: { name: string; rating: number; reviews: number }[] = [];
        let categoryBreakdown: { name: string; count: number; percentage: number }[] = [];
        try {
          lowStockAlerts = (products || [])
            .filter((p) => p.is_active && (p.stock_quantity || 0) < 10)
            .map((p) => ({
              name: p.name || "Unknown",
              stock: p.stock_quantity || 0,
              threshold: 10,
            }))
            .slice(0, 5);
        } catch {
          lowStockAlerts = [];
        }
        try {
          topRated = (products || [])
            .filter((p) => p.rating)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 4)
            .map((p) => ({
              name: p.name || "Unknown",
              rating: Number(p.rating) || 0,
              reviews: p.review_count || 0,
            }));
        } catch {
          topRated = [];
        }
        try {
          if (products && products.length > 0) {
            const catMap = new Map<string, number>();
            for (const p of products) {
              const catArr = Array.isArray(p.categories)
                ? p.categories
                : p.categories
                  ? [p.categories as any]
                  : [];
              const label =
                (catArr[0] as any)?.name || p.category_id || "Uncategorized";
              catMap.set(label, (catMap.get(label) || 0) + 1);
            }
            categoryBreakdown = [...catMap.entries()].map(([key, count]) => ({
              name: key,
              count,
              percentage: totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0,
            }));
          }
        } catch {
          categoryBreakdown = [];
        }

        reportData = {
          total_products: totalProducts,
          active_products: activeProducts,
          inactive_products: totalProducts - activeProducts,
          total_stock: totalStock,
          low_stock_items: lowStock,
          low_stock_alerts: lowStockAlerts,
          top_rated: topRated,
          category_breakdown: categoryBreakdown,
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

        // Previous window change for new users.
        const prevFrom = new Date(fromDate.getTime() - (toDate.getTime() - fromDate.getTime())).toISOString();
        const { data: prevUsers } = await supabase
          .from("profiles")
          .select("id")
          .gte("created_at", prevFrom)
          .lt("created_at", fromStr);
        const prevUserCount = prevUsers?.length || 0;
        const newUsersChange =
          prevUserCount > 0 ? Math.round(((customers - prevUserCount) / prevUserCount) * 100) : 0;

        // Monthly user growth (last 7 buckets).
        const monthMap = new Map<string, number>();
        for (const u of users || []) {
          const d = new Date(u.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthMap.set(key, (monthMap.get(key) || 0) + 1);
        }
        const userGrowth = [...monthMap.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-7)
          .map(([date, count]) => ({ date, count }));

        // Lifetime top buyers by spend.
        let topBuyers: { name: string; orders: number; spent: number }[] = [];
        try {
          const { data: ordersData } = await supabase
            .from("orders")
            .select(
              "total, user_id, profiles!orders_user_id_fkey(first_name, last_name)"
            );
          const buyerAgg = new Map<
            string,
            { name: string; orders: number; spent: number }
          >();
          for (const od of ordersData || []) {
            const uid = od.user_id;
            if (!uid) continue;
            const prof = Array.isArray(od.profiles) ? od.profiles[0] : od.profiles;
            const name = prof
              ? `${prof.first_name || ""} ${prof.last_name || ""}`.trim()
              : "Unknown";
            const cur = buyerAgg.get(uid) || {
              name: name || "Unknown",
              orders: 0,
              spent: 0,
            };
            cur.orders += 1;
            cur.spent += od.total || 0;
            if (!cur.name || cur.name === "Unknown") cur.name = name || "Unknown";
            buyerAgg.set(uid, cur);
          }
          topBuyers = [...buyerAgg.values()]
            .sort((a, b) => b.spent - a.spent)
            .slice(0, 4);
        } catch {
          topBuyers = [];
        }

        reportData = {
          total_users: totalUsers,
          new_customers: customers,
          new_sellers: sellers,
          new_admins: admins,
          new_users_change: newUsersChange,
          user_growth: userGrowth,
          top_buyers: topBuyers,
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
