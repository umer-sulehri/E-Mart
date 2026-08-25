import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: product, error } = await supabase
      .from("products")
      .select(
        `
        *,
        categories(id, name, slug, description, image_url),
        vendors(id, name, slug, logo_url, rating, total_sales),
        brands(id, name, slug, logo_url)
      `
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const { data: reviewStats } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", product.id);

    const avgRating =
      reviewStats && reviewStats.length > 0
        ? reviewStats.reduce((sum, r) => sum + r.rating, 0) /
          reviewStats.length
        : product.rating || 0;

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviewStats?.length || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
