import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "*, order_items(*, products(id, name, slug, images, vendor_id)), profiles!inner(first_name, last_name, email, phone)"
      )
      .eq("id", id)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const items = (order.order_items as Array<Record<string, unknown>> | undefined) || [];
    const hasSellerProduct = items.some((item) => {
      const prod = item.products as unknown;
      const entries = Array.isArray(prod)
        ? (prod as Array<{ vendor_id?: string | null }>)
        : prod && typeof prod === "object"
        ? [prod as { vendor_id?: string | null }]
        : [];
      return entries.some((p) => p.vendor_id === vendor.id);
    });

    if (!hasSellerProduct && profile.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    const body = await request.json();
    const { status } = body;

    // Sellers drive fulfillment forward. "pending" is the order-creation state
    // set by the system, so it is not a valid seller target. Terminal states
    // (delivered/cancelled/returned/refunded) are final.
    const FULFILLMENT_RANK: Record<string, number> = {
      confirmed: 0,
      processing: 1,
      shipped: 2,
      out_for_delivery: 3,
      delivered: 4,
    };
    const TERMINAL_STATUSES = ["delivered", "cancelled", "returned", "refunded"];

    if (!status) {
      return NextResponse.json(
        { success: false, error: "status is required" },
        { status: 400 }
      );
    }

    if (!TERMINAL_STATUSES.includes(status) && !(status in FULFILLMENT_RANK)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!vendor && profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, order_items(products(vendor_id))")
      .eq("id", id)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const currentStatus = String(order.status || "pending");

    // Terminal orders can never change again (protects delivered history from
    // being reset to "processing").
    if (TERMINAL_STATUSES.includes(currentStatus)) {
      return NextResponse.json(
        { success: false, error: "This order is already final and cannot be changed" },
        { status: 400 }
      );
    }

    // Cancellation is allowed from any non-terminal state.
    if (status !== "cancelled") {
      const currentRank = FULFILLMENT_RANK[currentStatus];
      const nextRank = FULFILLMENT_RANK[status];
      // "pending" has no rank (rank 0 belongs to "confirmed"), so treat it as
      // one step behind confirmed to allow sellers to advance a fresh order.
      const currentRankValue =
        currentRank !== undefined ? currentRank : FULFILLMENT_RANK.confirmed - 1;
      if (nextRank !== undefined && currentRankValue > nextRank) {
        return NextResponse.json(
          { success: false, error: "Cannot move the order backwards" },
          { status: 400 }
        );
      }
    }

    // PostgREST may embed `products` as an object (one-to-one) or an array
    // (nullable FK), so normalize before checking vendor ownership.
    const items = (order.order_items as Array<Record<string, unknown>> | undefined) || [];
    const hasSellerProduct = items.some((item) => {
      const prod = item.products as unknown;
      const entries = Array.isArray(prod)
        ? (prod as Array<{ vendor_id?: string | null }>)
        : prod && typeof prod === "object"
        ? [prod as { vendor_id?: string | null }]
        : [];
      return entries.some((p) => p.vendor_id === vendor?.id);
    });

    if (!hasSellerProduct && profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    const { data: updated, error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: updated, message: "Order status updated" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
