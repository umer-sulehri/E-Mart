import { Product } from '@/lib/types';
import { WishlistRepository } from '../contracts/WishlistRepository';
import { createClient } from '@/lib/supabase/server';

function mapProduct(row: Record<string, unknown>, images: string[], tags: string[], category: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    nameUrdu: (row.name_urdu as string) ?? undefined,
    description: (row.description as string) ?? '',
    descriptionUrdu: (row.description_urdu as string) ?? undefined,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
    images,
    category: {
      id: category.id as string,
      slug: category.slug as string,
      name: category.name as string,
      nameUrdu: (category.name_urdu as string) ?? undefined,
      icon: (category.icon as string) ?? '',
      image: (category.image as string) ?? undefined,
      parentId: (category.parent_id as string) ?? undefined,
    },
    categoryId: row.category_id as string,
    stock: (row.stock as number) ?? 0,
    rating: Number(row.rating ?? 0),
    reviewCount: (row.review_count as number) ?? 0,
    tags,
    isFeatured: (row.is_featured as boolean) ?? false,
    isNew: (row.is_new as boolean) ?? false,
    createdAt: row.created_at as string,
  };
}

export class SupabaseWishlistRepository implements WishlistRepository {
  async get(userId: string): Promise<string[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', userId);
    if (error) throw error;
    return data?.map((w) => w.product_id as string) ?? [];
  }

  async getItems(userId: string): Promise<Product[]> {
    const supabase = await createClient();
    const { data: wishRows, error: wishErr } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', userId);
    if (wishErr) throw wishErr;
    const productIds = wishRows?.map((w) => w.product_id as string) ?? [];
    if (productIds.length === 0) return [];

    const [productsRes, imagesRes, attrsRes] = await Promise.all([
      supabase.from('products').select('*').in('id', productIds),
      supabase.from('product_images').select('*').in('product_id', productIds),
      supabase.from('product_attributes').select('*').in('product_id', productIds),
    ]);

    if (productsRes.error) throw productsRes.error;

    const categoryIds = [...new Set((productsRes.data ?? []).map((p) => p.category_id as string))];
    const categoriesRes = categoryIds.length
      ? await supabase.from('categories').select('*').in('id', categoryIds)
      : { data: [], error: null };
    if (categoriesRes.error) throw categoriesRes.error;

    const catMap = new Map<string, Record<string, unknown>>();
    (categoriesRes.data ?? []).forEach((c) => catMap.set(c.id as string, c));

    const imgMap = new Map<string, string[]>();
    (imagesRes.data ?? []).forEach((img) => {
      const arr = imgMap.get(img.product_id as string) ?? [];
      arr.push(img.url as string);
      imgMap.set(img.product_id as string, arr);
    });

    const tagMap = new Map<string, string[]>();
    (attrsRes.data ?? []).forEach((attr) => {
      if (attr.key === 'tag') {
        const arr = tagMap.get(attr.product_id as string) ?? [];
        arr.push(attr.value as string);
        tagMap.set(attr.product_id as string, arr);
      }
    });

    return (productsRes.data ?? []).map((row) =>
      mapProduct(row, imgMap.get(row.id as string) ?? [], tagMap.get(row.id as string) ?? [], catMap.get(row.category_id as string) ?? {})
    );
  }

  async add(userId: string, productId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('wishlists')
      .insert({ user_id: userId, product_id: productId });
    if (error) throw error;
  }

  async remove(userId: string, productId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    if (error) throw error;
  }

  async hasItem(userId: string, productId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();
    if (error) throw error;
    return data !== null;
  }
}
