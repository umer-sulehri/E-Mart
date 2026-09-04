import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAdminLog } from "@/lib/audit";

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

    const { data: links, error } = await supabase
      .from("settings")
      .select("*")
      .eq("key", "social_links")
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const socialLinks = (links?.value as Record<string, unknown>)?.links || [];

    return NextResponse.json({ success: true, data: socialLinks });
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
    const { platform, url, is_active } = body;

    if (!platform || !url) {
      return NextResponse.json(
        { success: false, error: "platform and url are required" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "social_links")
      .single();

    const currentLinks =
      (existing?.value as Record<string, unknown>)?.links || [];

    const newLink = {
      id: crypto.randomUUID(),
      platform,
      url,
      is_active: is_active !== false,
      created_at: new Date().toISOString(),
    };

    const updatedLinks = [...(currentLinks as Array<Record<string, unknown>>), newLink];

    const { error } = await supabase
      .from("settings")
      .upsert(
        { key: "social_links", value: { links: updatedLinks } },
        { onConflict: "key" }
      );

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await writeAdminLog(supabase, user.id, {
      action: "create_social_link",
      entityType: "social_link",
      entityId: newLink.id,
      details: { platform, url },
    });

    return NextResponse.json(
      { success: true, data: newLink, message: "Social link created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
