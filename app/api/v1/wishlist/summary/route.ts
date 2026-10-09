import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * The whole wishlist in one cheap, un-joined request.
 *
 * The header badge, the side drawer and every product card's heart all need the
 * same two facts: how many items are saved, and which product ids are in the
 * set. Before this route each card asked `GET /api/v1/wishlist?productId=` for
 * itself, so a 24-card grid fired 24 requests and the count was unavailable
 * without fetching the full list. One row-per-id query replaces all of that.
 *
 * `ids` is a bare column select — no join to `products`, no `images` payload —
 * because a wishlist with a few hundred entries is still a few hundred UUIDs.
 */
export async function GET() {
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

    const { data, error } = await supabase
      .from("wishlist_items")
      .select("product_id")
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const productIds = (data ?? []).map(
      (row) => row.product_id as string
    );

    return NextResponse.json({
      success: true,
      data: {
        count: productIds.length,
        productIds,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}