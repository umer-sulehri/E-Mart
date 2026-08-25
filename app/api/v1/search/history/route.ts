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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", `search_history_${user.id}`)
      .single();

    const history =
      ((setting?.value as Record<string, unknown>)?.queries as Array<Record<string, unknown>>) || [];
    const trimmed = history.slice(0, limit);

    return NextResponse.json({ success: true, data: trimmed });
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
    const { query } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "A non-empty query string is required" },
        { status: 400 }
      );
    }

    const settingKey = `search_history_${user.id}`;

    const { data: existing } = await supabase
      .from("settings")
      .select("value")
      .eq("key", settingKey)
      .single();

    const current =
      ((existing?.value as Record<string, unknown>)?.queries as Array<Record<string, unknown>>) || [];

    const filtered = current.filter(
      (item) => (item.query as string).toLowerCase() !== query.trim().toLowerCase()
    );

    const updated = [
      { query: query.trim(), searched_at: new Date().toISOString() },
      ...filtered,
    ].slice(0, 50);

    const { error } = await supabase
      .from("settings")
      .upsert(
        { key: settingKey, value: { queries: updated } },
        { onConflict: "key" }
      );

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Search saved to history",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
