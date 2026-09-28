import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPaginationMeta, parsePagination } from "@/lib/pagination";

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
      .maybeSingle();

    if (profile?.role !== "seller" && profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams, { defaultLimit: 10 });

    // Star tabs have to be filtered here, not in the browser: filtering the
    // current page client-side caps every tab at one page of results and can
    // show an empty page while the seller's other pages are full.
    const ratingParam = searchParams.get("rating");
    const rating = ratingParam ? Number(ratingParam) : null;
    const hasValidRating = rating !== null && Number.isInteger(rating) && rating >= 1 && rating <= 5;

    let query = supabase
      .from("reviews")
      .select("*, products!inner(vendor_id, name, slug, images), profiles!inner(first_name, last_name, profile_image_url)", { count: "exact" })
      .eq("products.vendor_id", vendor.id)
      .order("created_at", { ascending: false });

    if (hasValidRating) {
      query = query.eq("rating", rating);
    }

    // Ranged after the filter so `count` and the page window describe the same
    // result set.
    const { data: reviews, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // The rating summary describes the seller's whole review history, not the
    // rows on this page. It deliberately ignores `rating` so the distribution
    // and average stay put while the user clicks between star tabs.
    const { data: ratingRows, error: ratingError } = await supabase
      .from("reviews")
      .select("rating")
      .eq("products.vendor_id", vendor.id);

    const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    let ratingSum = 0;
    for (const row of ratingRows || []) {
      const value = Number(row.rating);
      if (!Number.isFinite(value)) continue;
      if (value >= 1 && value <= 5) {
        distribution[String(Math.trunc(value))] += 1;
        ratingSum += value;
      }
    }
    const ratedCount = ratingRows?.length ?? 0;

    return NextResponse.json({
      success: true,
      data: reviews || [],
      stats: {
        // Averaged over rated reviews only, so a 0/0 cannot appear.
        averageRating: ratedCount > 0 ? Math.round((ratingSum / ratedCount) * 10) / 10 : 0,
        distribution,
        totalRated: ratedCount,
      },
      meta: buildPaginationMeta(page, limit, count || 0),
    });
  } catch (error) {
    console.error("[v1/seller/reviews/route] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
