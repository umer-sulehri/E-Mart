import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        { success: false, error: "Seller access required" },
        { status: 403 }
      );
    }

    const { data: existing } = await supabase
      .from("coupons")
      .select("id, created_by")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Coupon not found" },
        { status: 404 }
      );
    }

    if (existing.created_by !== user.id && profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Permission denied" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.code !== undefined) updates.code = String(body.code).toUpperCase().trim();
    if (body.description !== undefined) updates.description = body.description || null;
    if (body.discountType !== undefined) {
      const normalized = body.discountType === "fixed" ? "fixed_amount" : body.discountType;
      if (["percentage", "fixed_amount", "free_shipping"].includes(normalized)) {
        updates.discount_type = normalized;
      }
    }
    if (body.discountValue !== undefined) updates.discount_value = parseFloat(body.discountValue);
    if (body.minOrder !== undefined) updates.minimum_order_amount = parseFloat(body.minOrder) || 0;
    if (body.usageLimit !== undefined) updates.usage_limit = parseInt(body.usageLimit) || null;
    if (body.isActive !== undefined) updates.is_active = body.isActive === true;
    if (body.startsAt !== undefined) updates.starts_at = body.startsAt;
    if (body.expiresAt !== undefined) updates.expires_at = body.expiresAt;

    const { data: coupon, error } = await supabase
      .from("coupons")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: coupon,
      message: "Coupon updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        { success: false, error: "Seller access required" },
        { status: 403 }
      );
    }

    const { data: existing } = await supabase
      .from("coupons")
      .select("id, created_by")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Coupon not found" },
        { status: 404 }
      );
    }

    if (existing.created_by !== user.id && profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Permission denied" },
        { status: 403 }
      );
    }

    const { error } = await supabase.from("coupons").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
