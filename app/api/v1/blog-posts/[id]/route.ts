import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const slug = decodeURIComponent(id);

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select("*, profiles(id, first_name, last_name, profile_image_url)")
      .eq("slug", slug)
      .eq("status", "published")
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
      .eq("id", post.id);

    const normalized = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      coverImage: post.featured_image || "/images/post-thumbnail-1.jpg",
      category: post.category || "News",
      categorySlug: (post.category || "news").toLowerCase().replace(/\s+/g, "-"),
      author: {
        name: post.profiles
          ? `${post.profiles.first_name} ${post.profiles.last_name}`.trim()
          : "E-Mart Team",
        avatar: post.profiles?.profile_image_url || "/images/avatar-1.jpg",
      },
      date: post.published_at || post.created_at,
      readTime: "5 min read",
      tags: post.tags || [],
      content: post.content,
    };

    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
