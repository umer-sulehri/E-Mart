import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .eq("is_published", true)
      .single();

    if (error || !post) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    await supabase
      .from("blog_posts")
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq("id", id);

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
