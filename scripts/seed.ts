/**
 * Seeds the Supabase database with the mock catalog
 * (lib/mock/products.ts): categories + products + images.
 *
 * Usage: npx tsx scripts/seed.ts
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { mockCategories, mockProducts } from '../lib/mock/products';

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local');
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

async function chunkedUpsert(
  supabase: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
  chunkSize = 50,
): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict })
      .select('id,slug');
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
    for (const row of (data ?? []) as Array<{ id: string; slug: string }>) {
      idMap.set(row.slug, row.id);
    }
  }
  return idMap;
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ── 1. Categories (parents first, then children) ──────────────────────────
  const parents = mockCategories.map((c) => ({
    slug: c.slug,
    name: c.name,
    name_urdu: c.nameUrdu ?? null,
    icon: c.icon ?? null,
    image: c.image ?? null,
    sort_order: mockCategories.indexOf(c),
  }));

  const parentMap = await chunkedUpsert(supabase, 'categories', parents, 'slug');
  console.log(`Categories: ${parentMap.size} parents upserted`);

  const children = mockCategories.flatMap((parent, pi) =>
    (parent.children ?? []).map((child, ci) => ({
      slug: child.slug,
      name: child.name,
      name_urdu: child.nameUrdu ?? null,
      icon: child.icon ?? null,
      image: null,
      parent_id: parentMap.get(parent.slug)!,
      sort_order: pi * 100 + ci,
    })),
  );

  const childMap = await chunkedUpsert(supabase, 'categories', children, 'slug');
  console.log(`Categories: ${childMap.size} children upserted`);

  const catMap = new Map([...parentMap, ...childMap]);

  // Mock data references categories by their mock ids (cat-1, cat-1-1, ...)
  const mockIdToSlug = new Map<string, string>();
  for (const c of mockCategories) {
    mockIdToSlug.set(c.id, c.slug);
    for (const child of c.children ?? []) {
      mockIdToSlug.set(child.id, child.slug);
    }
  }

  // ── 2. Products ───────────────────────────────────────────────────────────
  const skipped: string[] = [];
  const productRows = [];
  for (const p of mockProducts) {
    const categoryId = catMap.get(mockIdToSlug.get(p.categoryId) ?? '');
    if (!categoryId) {
      skipped.push(`${p.slug} (unknown category ${p.categoryId})`);
      continue;
    }
    productRows.push({
      slug: p.slug,
      name: p.name,
      name_urdu: p.nameUrdu ?? null,
      description: p.description ?? null,
      description_urdu: p.descriptionUrdu ?? null,
      price: p.price,
      original_price: p.originalPrice ?? null,
      stock: p.stock ?? 0,
      rating: p.rating ?? 0,
      review_count: p.reviewCount ?? 0,
      category_id: categoryId,
      tags: p.tags ?? [],
      is_featured: p.isFeatured ?? false,
      is_new: p.isNew ?? false,
      status: 'active',
      created_at: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
    });
  }

  const productMap = await chunkedUpsert(supabase, 'products', productRows, 'slug');
  console.log(`Products: ${productMap.size} upserted${skipped.length ? `, skipped: ${skipped.join(', ')}` : ''}`);

  // ── 3. Product images (replace existing per product) ──────────────────────
  const ids = [...productMap.values()];
  const { error: delError } = await supabase.from('product_images').delete().in('product_id', ids);
  if (delError) throw new Error(`image cleanup failed: ${delError.message}`);

  const imageRows = mockProducts.flatMap((p) => {
    const productId = productMap.get(p.slug);
    if (!productId) return [];
    return (p.images ?? []).map((imageUrl, i) => ({
      product_id: productId,
      image_url: imageUrl,
      alt_text: p.name,
      sort_order: i,
      is_primary: i === 0,
    }));
  });

  for (let i = 0; i < imageRows.length; i += 100) {
    const { error } = await supabase.from('product_images').insert(imageRows.slice(i, i + 100));
    if (error) throw new Error(`image insert failed: ${error.message}`);
  }
  console.log(`Images: ${imageRows.length} inserted`);

  // ── 4. Verify ─────────────────────────────────────────────────────────────
  const [{ count: catCount }, { count: prodCount }, { count: imgCount }] = await Promise.all([
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('product_images').select('*', { count: 'exact', head: true }),
  ]);
  console.log(`\nDone. Live counts -> categories: ${catCount}, products: ${prodCount}, images: ${imgCount}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
