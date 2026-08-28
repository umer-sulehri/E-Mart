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

    const rows = categories || [];
    const keyByParent = new Map<string, typeof rows>();

    for (const cat of rows) {
      if (cat.parent_id) {
        const list = keyByParent.get(cat.parent_id) || [];
        list.push(cat);
        keyByParent.set(cat.parent_id, list);
      }
    }

    // Top-level categories are those without a parent.
    const topLevel = rows.filter((c) => !c.parent_id);

    const categoriesWithSubs = topLevel.map((cat) => ({
      ...cat,
      subcategories: (keyByParent.get(cat.id) || []).map((sub) => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
      })),
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
