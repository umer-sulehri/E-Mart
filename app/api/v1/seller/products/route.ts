import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { safeSearchPattern, safeOrTerm } from "@/lib/search-safe";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { rateLimitByUserId, rateLimitHeaders } from "@/lib/rate-limit";
import {
  checkProductUploadQuota,
  recordProductUpload,
  PRODUCT_UPLOAD_ATTEMPT_LIMIT,
  PRODUCT_UPLOAD_ATTEMPT_WINDOW_MS,
  QUOTA_EXCEEDED_MESSAGE,
} from "@/lib/seller-quota";

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
      .maybeSingle();

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
      .maybeSingle();

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
      .select(
        "*, category:categories!products_category_id_fkey(id, name, slug), subcategory:categories!products_subcategory_id_fkey(id, name, slug)",
        { count: "exact" }
      )
      .eq("vendor_id", vendor.id);

    if (search) {
      const escaped = safeOrTerm(search);
      query = query.or(
        `name.ilike.%${escaped}%,sku.ilike.%${escaped}%`
      );
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
    console.error("[v1/seller/products/route] error:", error);
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
      .maybeSingle();

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
      .maybeSingle();

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

    // Abuse guard, separate from the daily quota: stops a throttled seller
    // from spamming this endpoint. Generous enough that creating a full day's
    // allowance in one burst is never affected.
    const attempt = await rateLimitByUserId(
      user.id,
      PRODUCT_UPLOAD_ATTEMPT_LIMIT,
      PRODUCT_UPLOAD_ATTEMPT_WINDOW_MS
    );
    if (!attempt.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many product upload attempts. Please wait a moment and try again.",
          meta: {
            remaining: attempt.remaining,
            resetAt: new Date(attempt.resetAt).toISOString(),
            retryAfterSec: attempt.retryAfterSec,
          },
        },
        { status: 429, headers: rateLimitHeaders(attempt) }
      );
    }

    const body = await request.json();
    const {
      name, description, shortDescription, price, discountPrice,
      stockQuantity, sku, categoryId, subcategoryId, brandId, brand,
      images, specifications, isFeatured, isNew, weight, dimensions, tags,
      isActive,
    } = body;

    const safeName = typeof name === "string" ? sanitizeHtml(name.trim()) : "";
    const safeDescription = typeof description === "string" ? sanitizeHtml(description) : "";
    const safeShortDescription = typeof shortDescription === "string" ? sanitizeHtml(shortDescription) : "";
    const safeSku = typeof sku === "string" ? sanitizeHtml(sku.trim()) : "";
    const safeBrand = typeof brand === "string" ? sanitizeHtml(brand.trim()) : "";

    if (!safeName || !price || !safeSku || !categoryId || !images?.length) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, price, sku, categoryId, images" },
        { status: 400 }
      );
    }

    // Daily upload quota (10 per rolling 24h). Checked after payload validation
    // so malformed requests do not consume a slot, and before brand resolution
    // and the slug-collision scan so a rejected upload does no further work.
    let quota;
    try {
      quota = await checkProductUploadQuota(supabase, vendor.id);
    } catch (quotaError) {
      // Fail closed: if usage cannot be determined we cannot safely hand out
      // a slot, so surface the failure instead of allowing the upload through.
      console.error("[v1/seller/products/route] quota check failed:", quotaError);
      return NextResponse.json(
        { success: false, error: "Could not verify upload allowance. Please try again." },
        { status: 503, headers: { "Retry-After": "30" } }
      );
    }

    if (quota.remaining === 0) {
      const resetAt = quota.resetAt ?? Date.now() + 24 * 60 * 60 * 1000;
      const retryAfterSec =
        quota.retryAfterSec ?? Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));

      return NextResponse.json(
        {
          success: false,
          error: QUOTA_EXCEEDED_MESSAGE,
          meta: {
            remaining: 0,
            limit: quota.limit,
            used: quota.used,
            resetAt: new Date(resetAt).toISOString(),
            retryAfterSec,
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSec),
            "X-RateLimit-Limit": String(quota.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
          },
        }
      );
    }


    // Resolve brand by name (or provided id) into brands.brand_id.
    // brands INSERT is admin-only RLS, so creating a new brand must go through
    // the admin client (the seller is authenticated and owns the product).
    let resolvedBrandId: string | null = brandId || null;
    if (!resolvedBrandId && typeof safeBrand === "string" && safeBrand.trim()) {
      const brandName = safeBrand.trim();
      const { data: existingBrand } = await supabase
        .from("brands")
        .select("id")
        .eq("name", brandName)
        .maybeSingle();
      if (existingBrand) {
        resolvedBrandId = existingBrand.id;
      } else {
        const admin = createAdminClient();
        const { data: createdBrand } = await admin
          .from("brands")
          .insert({ name: brandName, slug: slugify(brandName), is_active: true })
          .select("id")
          .single();
        resolvedBrandId = createdBrand?.id || null;
      }
    }

    const baseSlug = slugify(safeName);
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
        name: safeName,
        slug,
        description: safeDescription || "",
        short_description: safeShortDescription,
        price,
        discount_price: discountPrice,
        stock_quantity: stockQuantity || 0,
        sku: safeSku,
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

    // Only now that the row exists do we advance the Redis counter, so
    // `redisCount <= dbCount` always holds and a Redis-based rejection can
    // never be more permissive than the database. Never awaited: the row is
    // already committed, so a Redis hiccup must not fail a successful upload.
    void recordProductUpload(vendor.id);

    return NextResponse.json(
      { success: true, data: product, message: "Product created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[v1/seller/products/route] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
