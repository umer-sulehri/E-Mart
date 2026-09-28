import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPaginationMeta, parsePagination } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const { page, limit, offset } = parsePagination(searchParams, { defaultLimit: 20 });
    const ratingParam = Number(searchParams.get("rating") || 0);
    const rating =
      Number.isInteger(ratingParam) && ratingParam >= 1 && ratingParam <= 5
        ? ratingParam
        : 0;

    // Public read: every submitted review is visible to guests, buyers,
    // sellers and admins. Only explicitly rejected reviews stay hidden.
    let query = supabase
      .from("reviews")
      .select(
        "*, products(id, name, slug, images), profiles(id, first_name, last_name, profile_image_url)",
        { count: "exact" }
      )
      .in("status", ["approved", "pending"]);

    // Rating is filtered here rather than in the browser: filtering the current
    // page in the UI can only match the reviews that happen to be on it, so the
    // other pages of the same filter would be unreachable.
    if (rating) {
      query = query.eq("rating", rating);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const reviews = (data || []).map((review: Record<string, any>) => {
      const product = review.products ?? {};
      const profile = review.profiles ?? {};
      const images = Array.isArray(product.images) ? product.images : [];

      return {
        id: review.id,
        userId: review.user_id,
        userName:
          [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
          "Anonymous",
        userAvatar: profile.profile_image_url || "",
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        productName: product.name || "",
        productSlug: product.slug || "",
        productImage: images[0] || "",
        date: review.created_at,
        helpful: review.helpful_count ?? 0,
        helpfulByUser: false,
      };
    });

    // The headline average and count describe every visible review, not just
    // the ones on this page or matching the rating filter, so the summary does
    // not swing as the user pages around.
    const { data: statRows } = await supabase
      .from("reviews")
      .select("rating")
      .in("status", ["approved", "pending"]);

    const ratings = (statRows || []).map((row) => Number(row.rating) || 0);
    const totalReviews = ratings.length;
    const overallRating =
      totalReviews > 0
        ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / totalReviews) * 10) / 10
        : 0;

    return NextResponse.json({
      success: true,
      data: reviews,
      meta: buildPaginationMeta(page, limit, count || 0),
      stats: { totalReviews, overallRating },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
