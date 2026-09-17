import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("reviews")
      .select(
        "*, products(id, name, slug, images), profiles(id, first_name, last_name, profile_image_url)",
        { count: "exact" }
      )
      // Public read: every submitted review is visible to guests, buyers,
      // sellers and admins. Only explicitly rejected reviews stay hidden.
      .in("status", ["approved", "pending"])
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

    return NextResponse.json({
      success: true,
      data: reviews,
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
