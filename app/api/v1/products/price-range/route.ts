import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const base = supabase
      .from("products")
      .select("price")
      .eq("is_active", true);

    const [minRes, maxRes] = await Promise.all([
      base.order("price", { ascending: true }).limit(1),
      base.order("price", { ascending: false }).limit(1),
    ]);

    const minRow = minRes.error ? null : minRes.data?.[0];
    const maxRow = maxRes.error ? null : maxRes.data?.[0];

    const min = minRow?.price != null ? Math.floor(Number(minRow.price)) : 0;
    const max = maxRow?.price != null ? Math.ceil(Number(maxRow.price)) : 100000;

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