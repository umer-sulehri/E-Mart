import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select("min(price), max(price)")
      .eq("is_active", true);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const row = Array.isArray(data) ? data[0] : null;
    const min = row?.min != null ? Math.floor(Number(row.min)) : 0;
    const max = row?.max != null ? Math.ceil(Number(row.max)) : 100000;

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