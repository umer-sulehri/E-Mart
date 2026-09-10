import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    // Anonymous visitors hit this route, and products UPDATE is admin/seller
    // only, so the increment runs with the admin client.
    const supabase = createAdminClient();

    const { data: product } = await supabase
      .from("products")
      .select("id, view_count")
      .eq("slug", slug)
      .single();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("products")
      .update({ view_count: (product.view_count || 0) + 1 })
      .eq("id", product.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "View recorded" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
