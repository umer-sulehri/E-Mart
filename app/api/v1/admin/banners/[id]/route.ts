import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAdminLog } from "@/lib/audit";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { user: null, error: "Not authenticated" as const, status: 401 as const };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { user: null, error: "Admin access required" as const, status: 403 as const };

  return { user, error: null, status: null };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const admin = await requireAdmin(supabase);
    if (admin.error) {
      return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
    }

    const body = await request.json();
    const { title, subtitle, image_url, link_url, position, display_order, is_active, start_date, end_date } = body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (subtitle !== undefined) updates.subtitle = subtitle;
    if (image_url !== undefined) updates.image_url = image_url;
    if (link_url !== undefined) updates.link_url = link_url;
    if (position !== undefined) updates.position = position;
    if (display_order !== undefined) updates.display_order = display_order;
    if (is_active !== undefined) updates.is_active = is_active;
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;
    updates.updated_at = new Date().toISOString();

    const { data: banner, error } = await supabase
      .from("banners")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await writeAdminLog(supabase, admin.user.id, {
      action: "update_banner",
      entityType: "banner",
      entityId: id,
      details: { updates },
    });

    return NextResponse.json({ success: true, data: banner, message: "Banner updated" });
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
    const { id } = await params;

    const admin = await requireAdmin(supabase);
    if (admin.error) {
      return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
    }

    const { error } = await supabase.from("banners").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await writeAdminLog(supabase, admin.user.id, {
      action: "delete_banner",
      entityType: "banner",
      entityId: id,
    });

    return NextResponse.json({ success: true, message: "Banner deleted" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
