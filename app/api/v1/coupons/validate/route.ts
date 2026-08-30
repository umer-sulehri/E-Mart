import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { couponSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = couponSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .ilike("code", parsed.data.code)
      .eq("is_active", true)
      .single();

    if (error || !coupon) {
      return NextResponse.json(
        { success: false, error: "Invalid coupon code" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    if (coupon.starts_at && now < coupon.starts_at) {
      return NextResponse.json(
        { success: false, error: "Coupon is not yet active" },
        { status: 400 }
      );
    }

    if (coupon.expires_at && now > coupon.expires_at) {
      return NextResponse.json(
        { success: false, error: "Coupon has expired" },
        { status: 400 }
      );
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json(
        { success: false, error: "Coupon usage limit reached" },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    if (coupon.discount_type === "percentage") {
      discountAmount = coupon.discount_value;
    } else if (coupon.discount_type === "fixed_amount") {
      discountAmount = coupon.discount_value;
    } else if (coupon.discount_type === "free_shipping") {
      discountAmount = 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        isValid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.discount_type,
          value: coupon.discount_value,
          description: coupon.description,
          minimumOrderAmount: coupon.minimum_order_amount,
          maximumDiscountAmount: coupon.maximum_discount_amount,
        },
        discountAmount,
        message: `Coupon applied: ${
          coupon.discount_type === "percentage"
            ? `${coupon.discount_value}% off`
            : coupon.discount_type === "fixed_amount"
            ? `Rs. ${coupon.discount_value} off`
            : "Free shipping"
        }`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
