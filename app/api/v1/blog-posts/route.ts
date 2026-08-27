import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const category = searchParams.get("category") || "";
    const offset = (page - 1) * limit;

    let query = supabase
      .from("blog_posts")
      .select("*, profiles(id, first_name, last_name, profile_image_url)", { count: "exact" })
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const normalized = (data || []).map((post: any) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      coverImage: post.featured_image || "/images/post-thumbnail-1.jpg",
      category: post.category || "News",
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
    }));

    return NextResponse.json({
      success: true,
      data: normalized,
      meta: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalItems: count || 0,
        itemsPerPage: limit,
        hasNextPage: page * limit < (count || 0),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
