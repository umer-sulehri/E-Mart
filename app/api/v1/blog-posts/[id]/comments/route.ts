import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("blog_comments")
      .select("id, content, created_at, user_id, profiles(id, first_name, last_name, profile_image_url)")
      .eq("post_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const comments = (data || []).map((c: any) => ({
      id: c.id,
      content: c.content,
      createdAt: c.created_at,
      author: c.profiles
        ? `${c.profiles.first_name} ${c.profiles.last_name}`.trim() || "User"
        : "User",
      avatar: c.profiles?.profile_image_url || "/images/avatar-1.jpg",
    }));

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "You must be signed in to comment" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json(
        { success: false, error: "Comment cannot be empty" },
        { status: 400 }
      );
    }

    const { data: post } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    const { data: comment, error } = await supabase
      .from("blog_comments")
      .insert({ post_id: id, user_id: user.id, content })
      .select("id, content, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: { id: comment.id, content: comment.content, createdAt: comment.created_at } },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
