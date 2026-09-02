import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeOrTerm } from "@/lib/search-safe";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    let query = supabase
      .from("reviews")
      .select(
        "*, products(name, slug), profiles(id, first_name, last_name, email, avatar_url)",
        { count: "exact" }
      );

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      const escaped = safeOrTerm(search);
      query = query.or(
        `comment.ilike.%${escaped}%,title.ilike.%${escaped}%,products.name.ilike.%${escaped}%`
      );
    }

    query = query.order("created_at", { ascending: false });

    const { data: reviews, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const normalized = (reviews || []).map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      images: r.images,
      status: r.status,
      helpful_count: r.helpful_count,
      is_verified_purchase: r.is_verified_purchase,
      created_at: r.created_at,
      product: r.products?.name || "Unknown product",
      product_slug: r.products?.slug,
      user_name: r.profiles
        ? `${r.profiles.first_name || ""} ${r.profiles.last_name || ""}`.trim() ||
          r.profiles.email
        : "Unknown user",
      user_email: r.profiles?.email,
    }));

    return NextResponse.json({
      success: true,
      data: normalized,
      meta: {
        totalItems: count || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
