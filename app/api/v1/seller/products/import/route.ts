import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseCsv } from "@/lib/csv";

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

    // Resolve categories and brands by name (create them if missing).
    const categoryCache = new Map<string, string | null>();
    const brandCache = new Map<string, string | null>();

    const resolveCategory = async (name: string): Promise<string | null> => {
      if (!name) return null;
      if (categoryCache.has(name)) return categoryCache.get(name) ?? null;
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("name", name)
        .maybeSingle();
      if (existing) {
        categoryCache.set(name, existing.id);
        return existing.id;
      }
      const { data: created } = await supabase
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
      const { data: existing } = await supabase
        .from("brands")
        .select("id")
        .eq("name", name)
        .maybeSingle();
      if (existing) {
        brandCache.set(name, existing.id);
        return existing.id;
      }
      const { data: created } = await supabase
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

    for (const item of uniqueImports) {
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
          errors.push({ name: item.name, error: error.message });
        } else {
          inserted++;
          insertedIds.push(product.id);
        }
      } catch (e) {
        errors.push({
          name: item.name,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    const skipped = imports.length - uniqueImports.length;

    return NextResponse.json({
      success: true,
      data: {
        imported: inserted,
        totalParsed: imports.length,
        skippedDuplicates: skipped,
        rowErrors,
        errors,
        insertedIds,
      },
      message: `Imported ${inserted} product(s)`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
