import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const supabase = await createClient();
    const searchTerm = `%${query}%`;

    const [productsResult, categoriesResult, brandsResult] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, slug, images, price, discount_price, is_active")
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .eq("is_active", true)
        .limit(5),
      supabase
        .from("categories")
        .select("id, name, slug, image_url")
        .ilike("name", searchTerm)
        .eq("is_active", true)
        .limit(3),
      supabase
        .from("brands")
        .select("id, name, slug, logo_url")
        .ilike("name", searchTerm)
        .eq("is_active", true)
        .limit(3),
    ]);

    const suggestions = [
      ...(categoriesResult.data || []).map((cat) => ({
        text: cat.name,
        type: "category" as const,
        slug: cat.slug,
        imageUrl: cat.image_url,
      })),
      ...(brandsResult.data || []).map((brand) => ({
        text: brand.name,
        type: "brand" as const,
        slug: brand.slug,
        imageUrl: brand.logo_url,
      })),
      ...(productsResult.data || []).map((product) => ({
        text: product.name,
        type: "product" as const,
        slug: product.slug,
        imageUrl: product.images?.[0],
        price: product.discount_price || product.price,
      })),
    ];

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
