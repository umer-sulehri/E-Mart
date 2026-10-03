import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePagination, buildPaginationMeta } from "@/lib/pagination";

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

    const { searchParams } = new URL(request.url);

    // Membership probe for the wishlist heart on a product card. The alternative
    // — pulling the whole wishlist to test one id — costs one full request per
    // card on a grid, and is silently wrong once the page is clamped.
    const productId = searchParams.get("productId");
    if (productId) {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: { saved: Boolean(data) } });
    }

    const { page, limit, offset } = parsePagination(searchParams);

    const { data: items, error, count } = await supabase
      .from("wishlist_items")
      .select("*, products(id, name, slug, price, discount_price, images, rating, review_count, is_active, stock_quantity)", { count: "exact" })
      .eq("user_id", user.id)
      // id is the tiebreaker: created_at alone is not unique, so two items saved
      // in the same instant can otherwise straddle a page boundary.
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: items || [],
      meta: buildPaginationMeta(page, limit, count || 0),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "productId is required" },
        { status: 400 }
      );
    }

    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("is_active", true)
      .single();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const { data: existing } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Product already in wishlist" },
        { status: 400 }
      );
    }

    const { data: created, error: insertError } = await supabase
      .from("wishlist_items")
      .insert({ user_id: user.id, product_id: productId })
      .select(
        "id, product_id, created_at, products(name, slug, price, discount_price, images, stock_quantity, is_active)"
      )
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    // The row comes back joined so the client can prepend it to the drawer
    // without the round trip a "re-fetch the list to see one new item" costs.
    return NextResponse.json(
      { success: true, message: "Added to wishlist", data: created },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
