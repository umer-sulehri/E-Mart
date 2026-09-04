import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAdminLog } from "@/lib/audit";

export async function PUT(
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

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.code !== undefined) updates.code = body.code.toUpperCase();
    if (body.description !== undefined) updates.description = body.description;
    if (body.type !== undefined) updates.type = body.type;
    if (body.value !== undefined) updates.value = body.value;
    if (body.minimumOrderAmount !== undefined) updates.minimum_order_amount = body.minimumOrderAmount;
    if (body.maximumDiscountAmount !== undefined) updates.maximum_discount_amount = body.maximumDiscountAmount;
    if (body.usageLimit !== undefined) updates.usage_limit = body.usageLimit;
    if (body.perUserLimit !== undefined) updates.per_user_limit = body.perUserLimit;
    if (body.isActive !== undefined) updates.is_active = body.isActive;
    if (body.startsAt !== undefined) updates.starts_at = body.startsAt;
    if (body.expiresAt !== undefined) updates.expires_at = body.expiresAt;
    if (body.applicableProductIds !== undefined) updates.applicable_product_ids = body.applicableProductIds;
    if (body.applicableCategoryIds !== undefined) updates.applicable_category_ids = body.applicableCategoryIds;
    if (body.excludeProductIds !== undefined) updates.exclude_product_ids = body.excludeProductIds;

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

    await writeAdminLog(supabase, user.id, {
      action: "update_coupon",
      entityType: "coupon",
      entityId: id,
      details: { updates },
    });

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

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await writeAdminLog(supabase, user.id, {
      action: "delete_coupon",
      entityType: "coupon",
      entityId: id,
    });

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
