import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPaginationMeta, parsePagination } from "@/lib/pagination";
import { safeOrTerm } from "@/lib/search-safe";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const { page, limit, offset } = parsePagination(searchParams);
    const category = searchParams.get("category") || "";
    const search = (searchParams.get("search") || "").trim();

    let query = supabase
      .from("blog_posts")
      .select("*, profiles(id, first_name, last_name, profile_image_url)", { count: "exact" })
      .eq("status", "published")
      .order("published_at", { ascending: false }).order("id", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    // Search runs here rather than in the browser: filtering the current page
    // client-side can only ever match the posts that happen to be on it, so
    // results would silently disappear on later pages.
    if (search) {
      const escaped = safeOrTerm(search);
      query = query.or(`title.ilike.%${escaped}%,excerpt.ilike.%${escaped}%`);
    }

    // Ranged after every filter, so `count` describes the same set the rows do.
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
      meta: buildPaginationMeta(page, limit, count || 0),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
