import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const { data: subcategories } = await supabase
      .from("subcategories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    const categoriesWithSubs = (categories || []).map((cat) => ({
      ...cat,
      subcategories: (subcategories || []).filter(
        (sub) => sub.category_id === cat.id
      ),
    }));

    return NextResponse.json({
      success: true,
      data: categoriesWithSubs,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
