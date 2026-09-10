import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAdminLog } from "@/lib/audit";
import { mutateSettingBlob } from "@/lib/settings-merge";

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

    const parsedUpdates: Record<string, unknown> = {};
    if (body.platform !== undefined) parsedUpdates.platform = body.platform;
    if (body.url !== undefined) {
      try {
        new URL(body.url);
      } catch {
        return NextResponse.json(
          { success: false, error: "url must be a valid URL" },
          { status: 400 }
        );
      }
      parsedUpdates.url = body.url;
    }
    if (body.is_active !== undefined) parsedUpdates.is_active = body.is_active;

    const outcome = await mutateSettingBlob(
      supabase,
      "social_links",
      (current) => {
        const links = (current.links as Array<Record<string, unknown>>) || [];
        const index = links.findIndex((l) => l.id === id);
        if (index === -1) return { ok: false, notFound: true };
        const updatedLinks = links.map((l, i) =>
          i === index ? { ...l, ...parsedUpdates } : l
        );
        return { ok: true, value: { links: updatedLinks } };
      }
    );

    if (!outcome.ok) {
      return NextResponse.json(
        { success: false, error: outcome.error.message },
        { status: outcome.error.status }
      );
    }

    const savedLinks =
      ((outcome.saved.value as Record<string, unknown>)?.links as Array<Record<string, unknown>>) ||
      [];
    const updatedLink = savedLinks.find((l) => l.id === id);
    const linkNotFound = !updatedLink;

    if (linkNotFound) {
      return NextResponse.json(
        { success: false, error: "Social link not found" },
        { status: 404 }
      );
    }

    await writeAdminLog(supabase, user.id, {
      action: "update_social_link",
      entityType: "social_link",
      entityId: id,
      details: { platform: updatedLink.platform },
    });

    return NextResponse.json({
      success: true,
      data: updatedLink,
      message: "Social link updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context);
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

    const outcome = await mutateSettingBlob(
      supabase,
      "social_links",
      (current) => {
        const links = (current.links as Array<Record<string, unknown>>) || [];
        const filteredLinks = links.filter((l) => l.id !== id);
        if (filteredLinks.length === links.length) {
          return { ok: false, notFound: true };
        }
        return { ok: true, value: { links: filteredLinks } };
      }
    );

    if (!outcome.ok) {
      return NextResponse.json(
        { success: false, error: outcome.error.message },
        { status: outcome.error.status }
      );
    }

    await writeAdminLog(supabase, user.id, {
      action: "delete_social_link",
      entityType: "social_link",
      entityId: id,
    });

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
