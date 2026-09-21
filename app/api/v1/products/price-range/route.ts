import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_PRICE_MAX, PRODUCT_PRICE_MIN } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    // Each query gets its own builder: postgrest-js filters/mutators (`order`,
    // `limit`) modify and return the same builder instance, so reusing one base
    // query for min/max silently piles both order clauses onto one request and
    // returns the wrong row for both.
    const [minRes, maxRes, lowDiscountRes] = await Promise.all([
      supabase
        .from("products")
        .select("price")
        .eq("is_active", true)
        .order("price", { ascending: true })
        .limit(1),
      supabase
        .from("products")
        .select("price")
        .eq("is_active", true)
        .order("price", { ascending: false })
        .limit(1),
      supabase
        .from("products")
        .select("discount_price")
        .eq("is_active", true)
        .not("discount_price", "is", null)
        .order("discount_price", { ascending: true })
        .limit(1),
    ]);

    const minRow = minRes.error ? null : minRes.data?.[0];
    const maxRow = maxRes.error ? null : maxRes.data?.[0];
    const lowDiscountRow = lowDiscountRes.error
      ? null
      : lowDiscountRes.data?.[0];

    const lowestDiscount =
      lowDiscountRow?.discount_price != null
        ? Number(lowDiscountRow.discount_price)
        : Infinity;

    const rawMin =
      minRow?.price != null
        ? Math.min(Number(minRow.price), lowestDiscount)
        : PRODUCT_PRICE_MIN;
    const rawMax =
      maxRow?.price != null ? Number(maxRow.price) : PRODUCT_PRICE_MAX;

    const min = Math.max(
      PRODUCT_PRICE_MIN,
      Math.floor(rawMin)
    );
    const max = Math.min(PRODUCT_PRICE_MAX, Math.ceil(rawMax));

    return NextResponse.json({
      success: true,
      data: { min, max },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}