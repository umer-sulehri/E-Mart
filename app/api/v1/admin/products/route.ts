import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAdminLog } from "@/lib/audit";
import { safeOrTerm } from "@/lib/search-safe";
import { parsePagination, buildPaginationMeta } from "@/lib/pagination";

// categories/vendors are many-to-one FKs from products, so embedding them never
// multiplies rows. They are still needed for the category filter and for the
// seller name the offers table renders.
const PRODUCT_SELECT =
  "*, categories!products_category_id_fkey(name, slug), vendors(name, slug, profiles(first_name, last_name))";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Count-only query: head:true returns no rows, and selecting a bare column lets
 * the engine answer from an index. An embedded select would instead count join
 * output rows, overstating the number of products.
 */
function countQuery(supabase: Supabase) {
  return supabase.from("products").select("id", { count: "exact", head: true });
}

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
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    // Offers screen filters: each accepts "true"/"false" so a cleared filter and
    // an explicitly-off filter stay distinguishable from "not set".
    const featuredParam = searchParams.get("featured");
    const isNewParam = searchParams.get("isNew");
    const onSaleParam = searchParams.get("onSale");
    const sellerSlugs = (searchParams.get("sellers") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Filters shared by the page query and the stat counts, so the cards and the
    // rows always agree on which products are in scope.
    const scope = (q: ReturnType<typeof countQuery>) => {
      if (search) {
        const escaped = safeOrTerm(search);
        q = q.or(
          `name.ilike.%${escaped}%,description.ilike.%${escaped}%,sku.ilike.%${escaped}%`
        );
      }
      if (status === "active") q = q.eq("is_active", true);
      else if (status === "inactive") q = q.eq("is_active", false);
      if (category) q = q.eq("categories.slug", category);
      if (sellerSlugs.length > 0) q = q.in("vendors.slug", sellerSlugs);
      return q;
    };

    let query = scope(supabase.from("products").select(PRODUCT_SELECT, { count: "exact" }));

    if (featuredParam === "true" || featuredParam === "false") {
      query = query.eq("is_featured", featuredParam === "true");
    }
    if (isNewParam === "true") query = query.eq("is_new", true);
    if (onSaleParam === "true") query = query.not("discount_price", "is", null);

    // Deterministic ordering: created_at alone is not unique, so rows created in the
    // same transaction can swap between requests and appear on two pages at once
    // (or on none). id is the tiebreaker.
    query = query.order("created_at", { ascending: false });
    query = query.order("id", { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // The offers stat cards need counts across the whole scoped set, not the
    // current page. head:true fetches no rows, so these stay index-only — and
    // with it the count is exact, where an embedded select would have counted
    // join output rows instead of products.
    const countScoped = async (flag: {
      featured?: boolean;
      isNew?: boolean;
      onSale?: boolean;
    }) => {
      let q = scope(countQuery(supabase));
      if (flag.featured !== undefined) q = q.eq("is_featured", flag.featured);
      if (flag.isNew) q = q.eq("is_new", true);
      if (flag.onSale) q = q.not("discount_price", "is", null);
      const res = await q;
      return res.count ?? 0;
    };

    const [featuredCount, isNewCount, discountedCount] = await Promise.all([
      countScoped({ featured: true }),
      countScoped({ isNew: true }),
      countScoped({ onSale: true }),
    ]);

    return NextResponse.json({
      success: true,
      data: products || [],
      meta: buildPaginationMeta(page, limit, count || 0),
      stats: {
        featured: featuredCount,
        isNew: isNewCount,
        discounted: discountedCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { productId, action } = body;

    if (!productId || !action) {
      return NextResponse.json(
        { success: false, error: "productId and action are required" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (action === "approve") {
      updates.status = "active";
      updates.is_active = true;
      updates.moderation_status = "approved";
    } else if (action === "flag") {
      updates.status = "inactive";
      updates.is_active = false;
      updates.moderation_status = "flagged";
    } else if (action === "remove") {
      updates.status = "archived";
      updates.is_active = false;
      updates.moderation_status = "removed";
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Use: approve, flag, remove" },
        { status: 400 }
      );
    }

    const { data: product, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", productId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    await writeAdminLog(supabase, user.id, {
      action: `moderate_product_${action}`,
      entityType: "product",
      entityId: product.id,
      details: { action, updates },
    });

    return NextResponse.json({
      success: true,
      data: product,
      message: `Product ${action}d successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
