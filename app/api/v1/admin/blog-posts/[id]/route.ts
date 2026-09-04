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

export async function GET(
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

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !post) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
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
    const { title, slug, excerpt, content, cover_image, category, is_published } = body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (slug !== undefined) updates.slug = slug;
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (content !== undefined) updates.content = content;
    if (cover_image !== undefined) updates.featured_image = cover_image;
    if (category !== undefined) updates.category = category;
    if (is_published !== undefined) {
      updates.status = is_published ? "published" : "draft";
      if (is_published) updates.published_at = new Date().toISOString();
    }
    updates.updated_at = new Date().toISOString();

    const { data: post, error } = await supabase
      .from("blog_posts")
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
      action: "update_blog_post",
      entityType: "blog_post",
      entityId: id,
      details: { updates },
    });

    return NextResponse.json({ success: true, data: post, message: "Blog post updated" });
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

    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await writeAdminLog(supabase, admin.user.id, {
      action: "delete_blog_post",
      entityType: "blog_post",
      entityId: id,
    });

    return NextResponse.json({ success: true, message: "Blog post deleted" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
