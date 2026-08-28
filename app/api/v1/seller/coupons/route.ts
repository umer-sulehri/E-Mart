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

    if (profile?.role !== "seller" && profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Seller access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    const baseQuery = supabase
      .from("coupons")
      .select("*", { count: "exact" })
      .eq("created_by", user.id);

    const { data: coupons, error, count } = await baseQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: coupons || [],
      meta: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalItems: count || 0,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
        { success: false, error: "Seller access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      code,
      discountType,
      discountValue,
      minOrder,
      usageLimit,
      startsAt,
      expiresAt,
      isActive,
      description,
    } = body;

    if (!code || !discountType || discountValue == null || !startsAt || !expiresAt) {
      return NextResponse.json(
        { success: false, error: "code, discountType, discountValue, startsAt, expiresAt are required" },
        { status: 400 }
      );
    }

    const validTypes = ["percentage", "fixed_amount", "free_shipping"];
    const normalizedType = discountType === "fixed" ? "fixed_amount" : discountType;
    if (!validTypes.includes(normalizedType)) {
      return NextResponse.json(
        { success: false, error: "discountType must be percentage, fixed_amount or free_shipping" },
        { status: 400 }
      );
    }

    const { data: existingCoupon } = await supabase
      .from("coupons")
      .select("id")
      .ilike("code", code)
      .single();

    if (existingCoupon) {
      return NextResponse.json(
        { success: false, error: "Coupon code already exists" },
        { status: 400 }
      );
    }

    const { data: coupon, error } = await supabase
      .from("coupons")
      .insert({
        code: String(code).toUpperCase().trim(),
        description: description || null,
        discount_type: normalizedType,
        discount_value: parseFloat(discountValue),
        minimum_order_amount: parseFloat(minOrder) || 0,
        usage_limit: parseInt(usageLimit) || null,
        used_count: 0,
        is_active: isActive !== false,
        starts_at: startsAt,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: coupon, message: "Coupon created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
