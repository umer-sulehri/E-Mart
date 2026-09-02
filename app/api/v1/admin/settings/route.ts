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

    const { data: settings, error } = await supabase
      .from("settings")
      .select("*")
      .order("key", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const rows = settings || [];

    const group = (section: string) => {
      const result: Record<string, unknown> = {};
      rows.forEach((row: { key: string; value: string }) => {
        if (!row.key.startsWith(`${section}.`)) return;
        const name = row.key.slice(section.length + 1);
        result[name] = parseValue(row.value);
      });
      return result;
    };

    return NextResponse.json({
      success: true,
      data: {
        general: group("general"),
        payments: group("payments"),
        shipping: group("shipping"),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

function parseValue(value: string | null): unknown {
  if (value === null || value === undefined) return "";
  const trimmed = String(value).trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed !== "" && !isNaN(Number(trimmed))) return Number(trimmed);
  // Try to parse JSON objects/arrays; otherwise return raw string.
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "object" && parsed !== null) return parsed;
  } catch {
    // not JSON, fall through
  }
  return value;
}

export async function PUT(request: NextRequest) {
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

    // Support both the sectioned UI contract ({ section, data }) and the
    // legacy flat { settings: {...} } contract, so the API stays backward compatible.
    let section = body?.section as string | undefined;
    let dataObj: Record<string, unknown> | undefined;

    if (body?.settings && typeof body.settings === "object") {
      dataObj = body.settings;
    } else if (body?.data && typeof body.data === "object") {
      dataObj = body.data;
    } else if (body?.general && typeof body.general === "object") {
      section = "general";
      dataObj = body.general;
    } else if (body?.payments && typeof body.payments === "object") {
      section = "payments";
      dataObj = body.payments;
    } else if (body?.shipping && typeof body.shipping === "object") {
      section = "shipping";
      dataObj = body.shipping;
    }

    if (!dataObj || !section) {
      return NextResponse.json(
        { success: false, error: "settings object with a section is required" },
        { status: 400 }
      );
    }

    const entries = Object.entries(dataObj);
    const rows = entries.map(([name, value]) => {
      const key = `${section}.${name}`;
      const stored = typeof value === "string" ? value : JSON.stringify(value);
      return { key, value: stored, updated_at: new Date().toISOString() };
    });

    const { data, error } = await supabase
      .from("settings")
      .upsert(rows, { onConflict: "key" })
      .select();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      message: "Settings updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
