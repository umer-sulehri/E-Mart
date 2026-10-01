import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseCsv } from "@/lib/csv";
import {
  checkProductUploadQuota,
  recordProductUpload,
  exemptQuotaStatus,
  isQuotaExempt,
  dailyLimitErrorResponse,
  isDailyLimitDatabaseError,
  planImportAgainstQuota,
  MAX_PRODUCTS_PER_DAY,
  type QuotaStatus,
} from "@/lib/seller-quota";

interface ImportRow {
  name: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  categoryName: string;
  subcategoryName: string;
  brandName: string;
  imageUrl: string;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

    // Daily product allowance, enforced on this path exactly as it is on the
    // single-product create route. Without it, CSV import was an unlimited
    // bypass of the limit. Checked before the file is even parsed so a seller
    // who is already done for the day gets an immediate, actionable 429.
    let quota: QuotaStatus;

    if (isQuotaExempt(profile?.role)) {
      quota = exemptQuotaStatus(MAX_PRODUCTS_PER_DAY);
    } else {
      try {
        quota = await checkProductUploadQuota(supabase, vendor.id);
      } catch (quotaError) {
        // Fail closed, matching the create route.
        console.error("[v1/seller/products/import/route] quota check failed:", quotaError);
        return NextResponse.json(
          { success: false, error: "Could not verify upload allowance. Please try again." },
          { status: 503, headers: { "Retry-After": "30" } }
        );
      }
    }

    const quotaExhausted = !quota.exempt && quota.remaining === 0;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No CSV file provided" },
        { status: 400 }
      );
    }

    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) {
      return NextResponse.json(
        { success: false, error: "CSV must contain at least a header row and one product" },
        { status: 400 }
      );
    }

    const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
    const dataRows = rows.slice(1);
    const headerMap: Record<string, number> = {};
    header.forEach((name, index) => {
      headerMap[name] = index;
    });

    const required = ["name", "sku", "price"];
    const get = (row: string[], key: string): string => {
      const idx = headerMap[key];
      return idx !== undefined ? (row[idx] || "").trim() : "";
    };

    const imports: ImportRow[] = [];
    const rowErrors: { row: number; error: string }[] = [];

    dataRows.forEach((row, idx) => {
      const line = idx + 2;
      for (const key of required) {
        if (!get(row, key)) {
          rowErrors.push({ row: line, error: `Missing required column "${key}"` });
          return;
        }
      }
      const price = parseFloat(get(row, "price"));
      if (isNaN(price) || price <= 0) {
        rowErrors.push({ row: line, error: `Invalid price: ${get(row, "price")}` });
        return;
      }
      const stock = get(row, "stock") ? parseInt(get(row, "stock"), 10) : 0;

      imports.push({
        name: get(row, "name"),
        sku: get(row, "sku"),
        description: get(row, "description") || "",
        price,
        stock: isNaN(stock) ? 0 : stock,
        categoryName: get(row, "category_name") || get(row, "category") || "",
        subcategoryName: get(row, "subcategory_name") || get(row, "subcategory") || "",
        brandName: get(row, "brand_name") || get(row, "brand") || "",
        imageUrl: get(row, "image_url") || get(row, "image") || "",
      });
    });

if (imports.length === 0) {
      const firstError =
        rowErrors.length > 0
          ? `No valid rows to import. First error (row ${rowErrors[0].row}): ${rowErrors[0].error}`
          : "No valid product rows found";
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    // Nothing to import and no allowance left: reject before touching the
    // database, so the seller sees the limit rather than a spurious 400.
    if (quotaExhausted && imports.length > 0) {
      const limited = dailyLimitErrorResponse(quota);
      return NextResponse.json(limited.body, { status: 429, headers: limited.headers });
    }

    // Resolve categories and brands by name (create them if missing).
    // categories/brands INSERT is admin-only RLS, so creating missing rows
    // runs with the admin client.
    const categoryCache = new Map<string, string | null>();
    const brandCache = new Map<string, string | null>();
    const admin = createAdminClient();

    const resolveCategory = async (name: string): Promise<string | null> => {
      if (!name) return null;
      if (categoryCache.has(name)) return categoryCache.get(name) ?? null;
      const { data: existing } = await admin
        .from("categories")
        .select("id")
        .eq("name", name)
        .maybeSingle();
      if (existing) {
        categoryCache.set(name, existing.id);
        return existing.id;
      }
      const { data: created } = await admin
        .from("categories")
        .insert({ name, slug: slugify(name), is_active: true })
        .select("id")
        .maybeSingle();
      const id = created?.id || null;
      categoryCache.set(name, id);
      return id;
    };

    const resolveBrand = async (name: string): Promise<string | null> => {
      if (!name) return null;
      if (brandCache.has(name)) return brandCache.get(name) ?? null;
      const { data: existing } = await admin
        .from("brands")
        .select("id")
        .eq("name", name)
        .maybeSingle();
      if (existing) {
        brandCache.set(name, existing.id);
        return existing.id;
      }
      const { data: created } = await admin
        .from("brands")
        .insert({ name, slug: slugify(name), is_active: true })
        .select("id")
        .maybeSingle();
      const id = created?.id || null;
      brandCache.set(name, id);
      return id;
    };

    // Ensure unique SKUs — skip duplicates that already exist.
    const seenSkus = new Set<string>();
    const uniqueImports: ImportRow[] = [];
    for (const item of imports) {
      if (seenSkus.has(item.sku)) continue;
      seenSkus.add(item.sku);
      const { data: existingSku } = await supabase
        .from("products")
        .select("id")
        .eq("sku", item.sku)
        .maybeSingle();
      if (!existingSku) uniqueImports.push(item);
    }

let inserted = 0;
    const insertedIds: string[] = [];
    const errors: { name: string; error: string }[] = [];

    // Rows beyond the remaining allowance are rejected rather than silently
    // dropped, so the seller knows exactly how many were skipped and why. The
    // import stops as soon as the allowance is spent rather than looping
    // through thousands of doomed inserts. planImportAgainstQuota is pure and
    // unit tested in lib/__tests__/seller-quota.test.ts.
    const plan = planImportAgainstQuota(uniqueImports, quota);

    // Grows to hold every row refused because of the allowance, whether refused
    // up front by the plan or mid-loop by the database trigger.
    const overQuotaRows: ImportRow[] = [...plan.rejected];

    for (const item of plan.accepted) {
      try {
        const category_id = await resolveCategory(item.categoryName);
        const subcategory_id = await resolveCategory(item.subcategoryName);
        const brand_id = await resolveBrand(item.brandName);

        let slug = slugify(item.name);
        let counter = 1;
        while (true) {
          const { data: existing } = await supabase
            .from("products")
            .select("id")
            .eq("slug", slug)
            .single();
          if (!existing) break;
          slug = `${slugify(item.name)}-${counter}`;
          counter++;
        }

        const { data: product, error } = await supabase
          .from("products")
          .insert({
            name: item.name,
            slug,
            sku: item.sku,
            description: item.description,
            price: item.price,
            stock_quantity: item.stock,
            category_id,
            subcategory_id,
            brand_id,
            vendor_id: vendor.id,
            images: item.imageUrl ? [item.imageUrl] : [],
            is_featured: false,
            is_new: true,
            is_active: false,
            status: "draft",
            tags: [],
            rating: 0,
            review_count: 0,
          })
          .select("id")
          .single();

        if (error) {
          // The authoritative gate again: a concurrent import or a direct insert
          // can exhaust the allowance between the check above and this insert.
          // This row and everything after it are refused by the database, so
          // report them as over-quota rather than as raw database errors.
          if (isDailyLimitDatabaseError(error)) {
            overQuotaRows.push(item, ...plan.accepted.slice(plan.accepted.indexOf(item) + 1));
            break;
          }
          errors.push({ name: item.name, error: error.message });
        } else {
          inserted++;
          insertedIds.push(product.id);
        }
      } catch (e) {
        console.error("[seller/import] error:", e);
        errors.push({
          name: item.name,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    const skipped = imports.length - uniqueImports.length;

    // Advance the Redis counter for every row that landed, so the cheap
    // fast-path rejection stays in step with the database. Fire and forget:
    // the rows are already committed, so a Redis hiccup must not fail a
    // successful import.
    for (let i = 0; i < inserted; i++) {
      void recordProductUpload(vendor.id);
    }

    // Name every row the allowance refused, so the seller can fix them and
    // retry tomorrow instead of guessing which products went missing.
    for (const item of overQuotaRows) {
      rowErrors.push({
        row: 0,
        error: `"${item.name}" not imported: daily limit of ${quota.limit} products reached. Try again tomorrow.`,
      });
    }

    const overQuota = overQuotaRows.length;
    const usedAfter = quota.used + inserted;

    return NextResponse.json(
      {
        success: true,
        data: {
          imported: inserted,
          totalParsed: imports.length,
          skippedDuplicates: skipped,
          rejectedOverQuota: overQuota,
          rowErrors,
          errors,
          insertedIds,
        },
        meta: {
          limit: quota.limit,
          used: usedAfter,
          remaining: Math.max(0, quota.limit - usedAfter),
          resetAt: quota.resetAt === null ? null : new Date(quota.resetAt).toISOString(),
        },
        message:
          overQuota > 0
            ? `Imported ${inserted} product(s). ${overQuota} row(s) rejected: daily limit of ${quota.limit} products reached. Try again tomorrow.`
            : `Imported ${inserted} product(s)`,
      },
      // A partial import that hit the ceiling is a limit outcome, not a success
      // with warnings, so the client can surface it as a toast and disable the
      // control for the rest of the day.
      overQuota > 0 ? { status: 429, headers: dailyLimitErrorResponse({ ...quota, used: quota.limit }).headers } : undefined
    );
  } catch (error) {
    console.error("[v1/seller/products/import/route] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
