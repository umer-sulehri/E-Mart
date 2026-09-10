import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAdminLog } from "@/lib/audit";
import { mutateSettingBlob } from "@/lib/settings-merge";

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

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: "url must be a valid URL" },
        { status: 400 }
      );
    }

    const newLink = {
      id: crypto.randomUUID(),
      platform,
      url,
      is_active: is_active !== false,
      created_at: new Date().toISOString(),
    };

    const outcome = await mutateSettingBlob(
      supabase,
      "social_links",
      (current) => {
        const links = (current.links as Array<Record<string, unknown>>) || [];
        return { ok: true, value: { links: [...links, newLink] } };
      }
    );

    if (!outcome.ok) {
      return NextResponse.json(
        { success: false, error: outcome.error.message },
        { status: outcome.error.status }
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
