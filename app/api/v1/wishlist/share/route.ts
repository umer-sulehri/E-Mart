import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from '@/lib/seo';

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

    const { data: items, error } = await supabase
      .from("wishlist_items")
      .select("product_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const token = Buffer.from(
      `${user.id}:${Date.now()}:${(items || []).map((i) => i.product_id).join(",")}`
    ).toString("base64url");

    const siteUrl = SITE_URL;

    return NextResponse.json({
      success: true,
      data: {
        url: `${siteUrl}/wishlist/shared/${token}`,
        token,
        itemCount: items?.length || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
