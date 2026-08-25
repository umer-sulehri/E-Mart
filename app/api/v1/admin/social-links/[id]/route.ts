import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    const { data: existing } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "social_links")
      .single();

    const links =
      ((existing?.value as Record<string, unknown>)?.links as Array<Record<string, unknown>>) || [];

    const index = links.findIndex((l) => l.id === id);
    if (index === -1) {
      return NextResponse.json(
        { success: false, error: "Social link not found" },
        { status: 404 }
      );
    }

    if (body.platform !== undefined) links[index].platform = body.platform;
    if (body.url !== undefined) links[index].url = body.url;
    if (body.is_active !== undefined) links[index].is_active = body.is_active;

    const { error } = await supabase
      .from("settings")
      .upsert(
        { key: "social_links", value: { links } },
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
      data: links[index],
      message: "Social link updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const { data: existing } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "social_links")
      .single();

    const links =
      ((existing?.value as Record<string, unknown>)?.links as Array<Record<string, unknown>>) || [];

    const filteredLinks = links.filter((l) => l.id !== id);

    if (filteredLinks.length === links.length) {
      return NextResponse.json(
        { success: false, error: "Social link not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("settings")
      .upsert(
        { key: "social_links", value: { links: filteredLinks } },
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
      message: "Social link deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
