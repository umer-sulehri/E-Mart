import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAdminLog } from "@/lib/audit";
import { slugify } from "@/lib/utils";
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePagination(searchParams);

    // Counts for the three stat cards. Derived from the page rows these cards
    // would report the numbers for 10 categories out of all of them, which is
    // worse than showing nothing — so they are counted outright instead.
    const [activeCount, productCount] = await Promise.all([
      supabase
        .from("categories")
        .select("*", { count: "exact", head: true })
        .is("parent_id", null)
        .eq("is_active", true),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
    ]);

    // Page over top-level categories only, then pull their children in one
    // extra query. Paging the flat table instead would split a parent from
    // its subcategories, and the admin table renders them as one unit - the
    // `count` would also then be off, because children are not countable rows.
    const {
      data: roots,
      error: rootsError,
      count,
    } = await supabase
      .from("categories")
      .select("*", { count: "exact" })
      .is("parent_id", null)
      .order("display_order", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + limit - 1);

    if (rootsError) {
      return NextResponse.json(
        { success: false, error: rootsError.message },
        { status: 500 }
      );
    }

    const rows = roots || [];

    // Subcategory hierarchy is stored in the categories table via parent_id.
    const childrenByParent = new Map<string, typeof rows>();
    if (rows.length > 0) {
      const { data: children, error: childrenError } = await supabase
        .from("categories")
        .select("*")
        .in(
          "parent_id",
          rows.map((cat) => cat.id)
        )
        .order("display_order", { ascending: true })
        .order("id", { ascending: true });

      if (childrenError) {
        return NextResponse.json(
          { success: false, error: childrenError.message },
          { status: 500 }
        );
      }

      for (const child of children || []) {
        if (child.parent_id) {
          const list = childrenByParent.get(child.parent_id) || [];
          list.push(child);
          childrenByParent.set(child.parent_id, list);
        }
      }
    }

    const data = rows.map((cat) => ({
      ...cat,
      subcategories: childrenByParent.get(cat.id) || [],
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: buildPaginationMeta(page, limit, count || 0),
      stats: {
        totalCategories: count || 0,
        activeCategories: activeCount.count || 0,
        totalProducts: productCount.count || 0,
      },
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, imageUrl, parentId, displayOrder } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        name,
        slug,
        description,
        image_url: imageUrl,
        parent_id: parentId,
        display_order: displayOrder || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await writeAdminLog(supabase, user.id, {
      action: "create_category",
      entityType: "category",
      entityId: category.id,
      details: { name: category.name },
    });

    return NextResponse.json(
      { success: true, data: category, message: "Category created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { categories } = body;

    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { success: false, error: "categories array is required" },
        { status: 400 }
      );
    }

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      await supabase
        .from("categories")
        .update({ display_order: i })
        .eq("id", cat.id);
    }

    await writeAdminLog(supabase, user.id, {
      action: "reorder_categories",
      entityType: "category",
      details: { count: categories.length },
    });

    return NextResponse.json({
      success: true,
      message: "Category order updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
