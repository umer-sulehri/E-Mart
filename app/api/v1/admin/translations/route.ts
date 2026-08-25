import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { data: setting, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "translations")
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const translations = (setting?.value as Record<string, Record<string, string>>) || {};

    return NextResponse.json({ success: true, data: translations });
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

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, locale, value } = body;

    if (!key || !locale || value === undefined) {
      return NextResponse.json(
        { success: false, error: "key, locale, and value are required" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "translations")
      .single();

    const allTranslations =
      (existing?.value as Record<string, Record<string, string>>) || {};

    if (!allTranslations[key]) {
      allTranslations[key] = {};
    }
    allTranslations[key][locale] = value;

    const { error } = await supabase
      .from("settings")
      .upsert(
        { key: "translations", value: allTranslations },
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
      data: { key, locale, value },
      message: "Translation updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
