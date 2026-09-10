import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_HISTORY = 50;

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
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20", 10) || 20,
      50
    );

    const { data: history, error } = await supabase
      .from("search_history")
      .select("id, query, results_count, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data:
        (history || []).map((h) => ({
          query: h.query,
          searched_at: h.created_at,
          results_count: h.results_count,
        })) || [],
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

    const body = await request.json();
    const { query, results_count } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "A non-empty query string is required" },
        { status: 400 }
      );
    }

    // Home the query: drop any previous identical entry so it moves to the top.
    await supabase
      .from("search_history")
      .delete()
      .eq("user_id", user.id)
      .ilike("query", query.trim());

    const { data: entry, error } = await supabase
      .from("search_history")
      .insert({
        user_id: user.id,
        query: query.trim(),
        results_count: typeof results_count === "number" ? results_count : 0,
      })
      .select("query, results_count, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Trim to the most recent MAX_HISTORY rows.
    const { data: ids } = await supabase
      .from("search_history")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(MAX_HISTORY, 100000);

    if (ids && ids.length > 0) {
      const staleIds = ids.map((i) => i.id);
      await supabase
        .from("search_history")
        .delete()
        .in("id", staleIds);
    }

    return NextResponse.json({
      success: true,
      data: { query: entry.query, searched_at: entry.created_at },
      message: "Search saved to history",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}