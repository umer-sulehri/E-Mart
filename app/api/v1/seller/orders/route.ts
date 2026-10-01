import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPaginationMeta, parsePagination } from "@/lib/pagination";

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
      .maybeSingle();

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
      .maybeSingle();

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const status = searchParams.get("status");

    const { data: productIds } = await supabase
      .from("products")
      .select("id")
      .eq("vendor_id", vendor.id);

    const ids = (productIds || []).map((p) => p.id);

    if (ids.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit, hasNextPage: false, hasPreviousPage: false },
      });
    }

    // Resolve the order ids first, then page over `orders` directly.
//
// Filtering `orders` by `order_items.product_id` in one query looks simpler, but
// order_items is one-to-many, so the range applies to *join rows*: an order with
// three of this seller's items occupies three slots. A page of 10 could then hold
// four orders, `count` would report item rows rather than orders, and an order
// straddling a boundary would be returned on two pages. Resolving ids first keeps
// the offset, the count and the rows all in units of orders.
const { data: itemRows, error: itemIdsError } = await supabase
      .from("order_items")
      .select("order_id")
      .in("product_id", ids);

    if (itemIdsError) {
      return NextResponse.json(
        { success: false, error: itemIdsError.message },
        { status: 500 }
      );
    }

    const orderIds = Array.from(
      new Set((itemRows || []).map((r) => r.order_id as string).filter(Boolean))
    );

    if (orderIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit, hasNextPage: false, hasPreviousPage: false },
      });
    }

    let query = supabase
      .from("orders")
      .select("*, order_items(product_id, product_name, quantity, price, total), profiles!inner(first_name, last_name, email)", { count: "exact" })
      .in("id", orderIds);

    if (status) {
      query = query.eq("status", status);
    }

    query = query.order("created_at", { ascending: false });
    // id breaks ties: created_at alone is not unique, so without it one order
    // could appear on two pages of the same listing.
    query = query.order("id", { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: orders || [],
      meta: buildPaginationMeta(page, limit, count || 0),
    });
  } catch (error) {
    console.error("[v1/seller/orders/route] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
