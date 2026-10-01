import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeSearchPattern } from "@/lib/search-safe";
import { parsePagination, buildPaginationMeta } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const { page, limit, offset } = parsePagination(searchParams);
    const search = searchParams.get("search") || "";

    let query = supabase
      .from("vendors")
      .select("id, name, slug, logo_url, description, rating, total_sales, created_at", {
        count: "exact",
      })
      .eq("status", "approved");

    if (search) {
      query = query.ilike("name", safeSearchPattern(search));
    }

    // total_sales is not unique, so id is the tiebreaker that keeps pages from
    // duplicating or skipping two vendors with the same sales total.
    query = query.order("total_sales", { ascending: false });
    query = query.order("id", { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      meta: buildPaginationMeta(page, limit, count || 0),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
