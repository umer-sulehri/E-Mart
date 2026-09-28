import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeOrTerm } from "@/lib/search-safe";
import { parsePagination, buildPaginationMeta } from "@/lib/pagination";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const { page, limit, offset } = parsePagination(searchParams, { defaultLimit: 12 });
    const sort = searchParams.get("sort") || "newest";
    const search = searchParams.get("search") || "";

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
      .select("*, categories!products_category_id_fkey(name, slug)", { count: "exact" })
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

    if (search) {
      // Escaped: PostgREST `.or()` treats commas and parentheses as syntax, so
      // an unescaped search term could rewrite the filter.
      const escaped = safeOrTerm(search);
      productQuery = productQuery.ilike("name", `%${escaped}%`);
    }

    productQuery = productQuery.range(offset, offset + limit - 1);

    const { data: products, error: productError, count } = await productQuery;

    if (productError) {
      return NextResponse.json(
        { success: false, error: productError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        seller,
        products: products || [],
      },
      meta: buildPaginationMeta(page, limit, count || 0),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
