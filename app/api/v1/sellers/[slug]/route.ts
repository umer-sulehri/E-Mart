import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const sort = searchParams.get("sort") || "newest";
    const offset = (page - 1) * limit;

    const { data: seller, error: sellerError } = await supabase
      .from("vendors")
      .select("id, name, slug, description, logo_url, rating, total_sales, created_at")
      .eq("slug", slug)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json(
        { success: false, error: "Seller not found" },
        { status: 404 }
      );
    }

    let productQuery = supabase
      .from("products")
      .select("*, categories!inner(name, slug)", { count: "exact" })
      .eq("vendor_id", seller.id)
      .eq("is_active", true);

    switch (sort) {
      case "price_asc":
        productQuery = productQuery.order("price", { ascending: true });
        break;
      case "price_desc":
        productQuery = productQuery.order("price", { ascending: false });
        break;
      case "rating":
        productQuery = productQuery.order("rating", { ascending: false });
        break;
      case "popular":
        productQuery = productQuery.order("review_count", { ascending: false });
        break;
      default:
        productQuery = productQuery.order("created_at", { ascending: false });
    }

    productQuery = productQuery.range(offset, offset + limit - 1);

    const { data: products, error: productError, count } = await productQuery;

    if (productError) {
      return NextResponse.json(
        { success: false, error: productError.message },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: {
        seller,
        products: products || [],
      },
      meta: {
        currentPage: page,
        totalPages,
        totalItems: count || 0,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
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
