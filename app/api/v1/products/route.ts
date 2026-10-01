import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeOrTerm } from "@/lib/search-safe";
import { parsePagination, buildPaginationMeta } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const { page, limit, offset } = parsePagination(searchParams);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    // The compare tray is locked to one category and identifies it by uuid, not
    // slug, so a slug-only filter cannot express "only the category already in
    // the table". Also matches sub-categories, mirroring the slug filter below.
    const categoryId = searchParams.get("categoryId") || "";
    const brand = searchParams.get("brand") || "";
    const categories =
      searchParams
        .get("categories")
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) || [];
    const brands =
      searchParams
        .get("brands")
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) || [];
    const inStockOnly = searchParams.get("inStock") === "true";
    const rawMinPrice = parseFloat(searchParams.get("minPrice") || "");
    const rawMaxPrice = parseFloat(searchParams.get("maxPrice") || "");
    const rawMinRating = parseFloat(searchParams.get("minRating") || "");
    const minPrice = Number.isFinite(rawMinPrice) ? rawMinPrice : undefined;
    const maxPrice = Number.isFinite(rawMaxPrice) ? rawMaxPrice : undefined;
    const minRating = Number.isFinite(rawMinRating) ? rawMinRating : undefined;
    const sort = searchParams.get("sort") || "newest";
    const status = searchParams.get("status") || "active";

    let query = supabase
      .from("products")
      .select(
        brand || brands.length > 0
          ? "*, categories!products_category_id_fkey(name, slug), brands!inner(name, slug), vendors(name, slug)"
          : "*, categories!products_category_id_fkey(name, slug), brands(name, slug), vendors(name, slug)",
        { count: "exact" }
      );

    if (status !== "all") {
      query = query.eq("is_active", status === "active");
    }

    if (search) {
      const escaped = safeOrTerm(search);
      query = query.or(
        `name.ilike.%${escaped}%,description.ilike.%${escaped}%,sku.ilike.%${escaped}%`
      );
    }

    const categorySlugs =
      categories.length > 0 ? categories : category ? [category] : [];
    if (categorySlugs.length > 0) {
      // Products carry the parent via `category_id` and the sub-category via
      // `subcategory_id`. Selecting a category must therefore match either FK,
      // and should also include products in that category's sub-categories.
      const { data: catRows } = await supabase
        .from("categories")
        .select("id")
        .in("slug", categorySlugs);

      const categoryIds = new Set<string>(
        (catRows || []).map((c) => c.id as string)
      );
      if (categoryIds.size === 0) {
        // No matching category rows (e.g. stale slug): match nothing.
        query = query.eq("id", "00000000-0000-0000-0000-000000000000");
      } else {
        const { data: childRows } = await supabase
          .from("categories")
          .select("id")
          .in("parent_id", Array.from(categoryIds));
        (childRows || []).forEach((c) => categoryIds.add(c.id as string));

        const ids = Array.from(categoryIds);
        query = query.or(
          `category_id.in.(${ids.join(",")}),subcategory_id.in.(${ids.join(",")})`
        );
      }
    }

    if (categoryId) {
      // A uuid is supplied directly, so there is no slug lookup to widen with
      // sub-categories here; the compare tray's lock is on the exact category.
      // A malformed value matches nothing rather than being ignored, so a bad
      // id can never widen the picker back to the whole catalogue.
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuid.test(categoryId)) {
        query = query.eq("id", "00000000-0000-0000-0000-000000000000");
      } else {
        query = query.or(
          `category_id.eq.${categoryId},subcategory_id.eq.${categoryId}`
        );
      }
    }

    if (brands.length > 0) {
      query = query.in("brands.slug", brands);
    } else if (brand) {
      query = query.eq("brands.slug", brand);
    }

    if (inStockOnly) {
      query = query.gt("stock_quantity", 0);
    }

    if (searchParams.get("featured") === "true") {
      query = query.eq("is_featured", true);
    }

    if (searchParams.get("on_sale") === "true") {
      query = query.not("discount_price", "is", null);
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      // Customers pay `discount_price` when set, otherwise `price`. Filter on
      // whichever applies: in-range price OR in-range discount price. NULL
      // discount prices fail the comparisons and are excluded from that branch.
      const cond = (column: string) => {
        const parts: string[] = [];
        if (minPrice !== undefined) parts.push(`${column}.gte.${minPrice}`);
        if (maxPrice !== undefined) parts.push(`${column}.lte.${maxPrice}`);
        return parts.length > 1 ? `and(${parts.join(",")})` : parts[0];
      };
      query = query.or(`${cond("price")},${cond("discount_price")}`);
    }

    if (minRating !== undefined) {
      query = query.gte("rating", minRating);
    }

    switch (sort) {
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "rating":
        query = query.order("rating", { ascending: false });
        break;
      case "popular":
        query = query.order("review_count", { ascending: false });
        break;
      case "name_asc":
        query = query.order("name", { ascending: true });
        break;
      case "name_desc":
        query = query.order("name", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    // Every sort key above is non-unique — two products can share a price, a
    // rating, a review count or a name. Without a unique tiebreaker Postgres may
    // return them in either order across two requests, so a product can appear
    // on page 1 and page 2 of the same listing, or on neither. id is unique, so
    // appending it makes every ordering total and every page stable.
    query = query.order("id", { ascending: false });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Safety net: a product related to multiple matching categories/brands can
    // surface more than once; keep the first occurrence per product id. The
    // category and brand filters both use `!inner` against many-to-one FKs, so
    // this should never actually fire — but if it did, `count` (which counts
    // join output rows) would overstate totalItems.
    const seen = new Set<string>();
    const deduped = (data || []).filter((product) => {
      const id = (product as { id?: string }).id;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return NextResponse.json({
      success: true,
      data: deduped,
      meta: buildPaginationMeta(page, limit, count || 0),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
