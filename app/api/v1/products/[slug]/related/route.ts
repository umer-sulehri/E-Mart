import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: product } = await supabase
      .from("products")
      .select("id, category_id")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const { data: related, error } = await supabase
      .from("products")
      .select(
        `
        *,
        categories!products_category_id_fkey(id, name, slug, image_url),
        brands(id, name, slug)
      `
      )
      .neq("id", product.id)
      .eq("category_id", product.category_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: related || [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
