import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAdminLog } from "@/lib/audit";
import { slugify } from "@/lib/utils";

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

    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const rows = categories || [];

    // Subcategory hierarchy is stored in the categories table via parent_id.
    const childrenByParent = new Map<string, typeof rows>();
    for (const cat of rows) {
      if (cat.parent_id) {
        const list = childrenByParent.get(cat.parent_id) || [];
        list.push(cat);
        childrenByParent.set(cat.parent_id, list);
      }
    }

    const data = rows.map((cat) => ({
      ...cat,
      subcategories: childrenByParent.get(cat.id) || [],
    }));

    return NextResponse.json({ success: true, data });
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
