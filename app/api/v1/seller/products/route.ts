import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

    if (profile?.role !== "seller" && profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("products")
      .select("*, categories(name, slug)", { count: "exact" })
      .eq("vendor_id", vendor.id);

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    if (status === "active") query = query.eq("is_active", true);
    else if (status === "inactive") query = query.eq("is_active", false);

    query = query.order("created_at", { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: products || [],
      meta: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalItems: count || 0,
        itemsPerPage: limit,
        hasNextPage: page * limit < (count || 0),
        hasPreviousPage: page > 1,
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

    if (profile?.role !== "seller" && profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name, description, shortDescription, price, discountPrice,
      stockQuantity, sku, categoryId, subcategoryId, brandId, brand,
      images, specifications, isFeatured, isNew, weight, dimensions, tags,
      isActive,
    } = body;

    if (!name || !price || !sku || !categoryId || !images?.length) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, price, sku, categoryId, images" },
        { status: 400 }
      );
    }

    // Resolve brand by name (or provided id) into brands.brand_id.
    let resolvedBrandId: string | null = brandId || null;
    if (!resolvedBrandId && typeof brand === "string" && brand.trim()) {
      const brandName = brand.trim();
      const { data: existingBrand } = await supabase
        .from("brands")
        .select("id")
        .eq("name", brandName)
        .maybeSingle();
      if (existingBrand) {
        resolvedBrandId = existingBrand.id;
      } else {
        const { data: createdBrand } = await supabase
          .from("brands")
          .insert({ name: brandName, slug: slugify(brandName), is_active: true })
          .select("id")
          .single();
        resolvedBrandId = createdBrand?.id || null;
      }
    }

    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .single();
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name,
        slug,
        description: description || "",
        short_description: shortDescription,
        price,
        discount_price: discountPrice,
        stock_quantity: stockQuantity || 0,
        sku,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        brand_id: resolvedBrandId,
        vendor_id: vendor.id,
        images,
        specifications: specifications || {},
        is_featured: isFeatured || false,
        is_new: isNew ?? true,
        is_active: isActive === true,
        status: isActive === true ? "active" : "draft",
        weight,
        dimensions,
        tags: tags || [],
        rating: 0,
        review_count: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: product, message: "Product created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
