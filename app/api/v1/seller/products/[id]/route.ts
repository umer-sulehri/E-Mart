import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: product, error } = await supabase
      .from("products")
      .select("*, categories(id, name, slug)")
      .eq("id", id)
      .eq("vendor_id", vendor.id)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .eq("vendor_id", vendor.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Product not found or unauthorized" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.shortDescription !== undefined) updates.short_description = body.shortDescription;
    if (body.price !== undefined) updates.price = body.price;
    if (body.discountPrice !== undefined) updates.discount_price = body.discountPrice;
    if (body.stockQuantity !== undefined) updates.stock_quantity = body.stockQuantity;
    if (body.sku !== undefined) updates.sku = body.sku;
    if (body.categoryId !== undefined) updates.category_id = body.categoryId;
    if (body.subcategoryId !== undefined) updates.subcategory_id = body.subcategoryId;
    if (body.brandId !== undefined) updates.brand_id = body.brandId;
    if (body.images !== undefined) updates.images = body.images;
    if (body.specifications !== undefined) updates.specifications = body.specifications;
    if (body.isFeatured !== undefined) updates.is_featured = body.isFeatured;
    if (body.isNew !== undefined) updates.is_new = body.isNew;
    if (body.isActive !== undefined) {
      updates.is_active = body.isActive;
      updates.status = body.isActive ? "active" : "inactive";
    }
    if (body.weight !== undefined) updates.weight = body.weight;
    if (body.dimensions !== undefined) updates.dimensions = body.dimensions;
    if (body.tags !== undefined) updates.tags = body.tags;

    if (
      body.brand !== undefined &&
      body.brand !== null &&
      typeof body.brand === "string" &&
      body.brand.trim()
    ) {
      const brandName = body.brand.trim();
      const { data: existingBrand } = await supabase
        .from("brands")
        .select("id")
        .eq("name", brandName)
        .maybeSingle();
      if (existingBrand) {
        updates.brand_id = existingBrand.id;
      } else {
        const { data: createdBrand } = await supabase
          .from("brands")
          .insert({ name: brandName, slug: slugify(brandName), is_active: true })
          .select("id")
          .single();
        if (createdBrand) updates.brand_id = createdBrand.id;
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: product, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
      message: "Product updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .eq("vendor_id", vendor.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Product not found or unauthorized" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("products")
      .update({ is_active: false, status: "inactive", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product deactivated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
