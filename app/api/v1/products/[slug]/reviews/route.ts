import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reviewSchema } from "@/lib/validators";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const sort = searchParams.get("sort") || "newest";
    const offset = (page - 1) * limit;

    const supabase = await createClient();

    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    let query = supabase
      .from("reviews")
      .select("*, profiles!inner(first_name, last_name, profile_image_url)", {
        count: "exact",
      })
      .eq("product_id", product.id);

    if (sort === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else if (sort === "highest") {
      query = query.order("rating", { ascending: false });
    } else if (sort === "lowest") {
      query = query.order("rating", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: reviews, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const { data: ratingBreakdown } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", product.id);

    const breakdown = [1, 2, 3, 4, 5].map((star) => ({
      rating: star,
      count: ratingBreakdown?.filter((r) => r.rating === star).length || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews || [],
        breakdown,
      },
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
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

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: "You have already reviewed this product" },
        { status: 400 }
      );
    }

    const { data: deliveredPurchase } = await supabase
      .from("order_items")
      .select("id, orders(status, user_id)")
      .eq("orders.user_id", user.id)
      .eq("orders.status", "delivered")
      .eq("product_id", product.id)
      .limit(1)
      .maybeSingle();

    const isVerified = !!deliveredPurchase;

    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert({
        user_id: user.id,
        product_id: product.id,
        rating: parsed.data.rating,
        title: parsed.data.title,
        comment: parsed.data.comment,
        is_verified_purchase: isVerified,
        helpful_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    const { data: allReviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", product.id);

    if (allReviews && allReviews.length > 0) {
      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) /
        allReviews.length;
      await supabase
        .from("products")
        .update({
          rating: Math.round(avgRating * 10) / 10,
          review_count: allReviews.length,
        })
        .eq("id", product.id);
    }

    return NextResponse.json(
      { success: true, data: review, message: "Review created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
