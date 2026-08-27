import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const supabase = await createClient();

    if (query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data: results, error } = await supabase
      .from("products")
      .select("id, name, slug, price, discount_price, images")
      .ilike("name", `%${query}%`)
      .eq("is_active", true)
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    interface Suggestion {
      type: 'product' | 'category';
      label: string;
      slug: string;
      price: number | null;
      image: string | null;
    }

    const suggestions: Suggestion[] = (results || []).map((p) => ({
      type: "product" as const,
      label: p.name,
      slug: p.slug,
      price: p.discount_price || p.price,
      image: p.images?.[0] || null,
    }));

    const { data: categoryResults } = await supabase
      .from("categories")
      .select("name, slug")
      .ilike("name", `%${query}%`)
      .limit(5);

    if (categoryResults) {
      suggestions.push(
        ...categoryResults.map((c) => ({
          type: "category" as const,
          label: c.name,
          slug: c.slug,
          price: null,
          image: null,
        }))
      );
    }

    return NextResponse.json({ success: true, data: suggestions });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
