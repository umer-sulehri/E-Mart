import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: setting, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "social_links")
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const allLinks =
      ((setting?.value as Record<string, unknown>)?.links as Array<Record<string, unknown>>) || [];

    const activeLinks = allLinks.filter((l) => l.is_active !== false);

    return NextResponse.json({ success: true, data: activeLinks });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
