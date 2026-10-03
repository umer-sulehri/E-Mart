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

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);
    const status = searchParams.get("status") || "";
    const sort = searchParams.get("sort") || "recent";

    let query = supabase
      .from("reviews")
      .select(
        "*, products(id, name, slug, images, price)",
        { count: "exact" }
      )
      .eq("user_id", user.id);

    if (status) {
      // Supports both single and comma-separated statuses (e.g. pending,approved).
      const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
      query = query.in("status", statuses);
    }

    if (sort === "highest") {
      query = query.order("rating", { ascending: false }).order("id", { ascending: false });
    } else if (sort === "lowest") {
      query = query.order("rating", { ascending: true }).order("id", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false }).order("id", { ascending: false });
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

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
