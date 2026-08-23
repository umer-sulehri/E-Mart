import { CartItem, Product, Category } from '@/lib/types';
import { CartRepository } from '../contracts/CartRepository';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

interface CartItemRow {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  products?: ProductRow;
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  name_urdu?: string;
  description: string;
  description_urdu?: string;
  price: number;
  original_price?: number;
  category_id: string;
  stock: number;
  rating: number;
  review_count: number;
  tags: string[];
  is_featured: boolean;
  is_new: boolean;
  created_at: string;
  categories?: CategoryRow;
  product_images?: ProductImageRow[];
}

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  name_urdu?: string;
  icon: string;
  image?: string;
  parent_id?: string;
}

interface ProductImageRow {
  image_url: string;
  sort_order?: number;
}

function mapProduct(row: ProductRow): Product {
  const category: Category = row.categories
    ? {
        id: row.categories.id,
        slug: row.categories.slug,
        name: row.categories.name,
        nameUrdu: row.categories.name_urdu,
        icon: row.categories.icon,
        image: row.categories.image,
        parentId: row.categories.parent_id,
      }
    : { id: row.category_id, slug: '', name: '', icon: '' };

  const images = row.product_images
    ? row.product_images.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((img) => img.image_url)
    : [];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameUrdu: row.name_urdu,
    description: row.description,
    descriptionUrdu: row.description_urdu,
    price: row.price,
    originalPrice: row.original_price,
    images,
    category,
    categoryId: row.category_id,
    stock: row.stock,
    rating: row.rating,
    reviewCount: row.review_count,
    tags: row.tags ?? [],
    isFeatured: row.is_featured,
    isNew: row.is_new,
    createdAt: row.created_at,
  };
}

function mapCartItem(row: CartItemRow): CartItem {
  return {
    id: row.id,
    productId: row.product_id,
    product: row.products ? mapProduct(row.products as ProductRow) : ({} as Product),
    quantity: row.quantity,
  };
}

const PRODUCT_SELECT = '*, categories(*), product_images(image_url, sort_order)';
const CART_ITEM_SELECT = `id, cart_id, product_id, quantity, products(${PRODUCT_SELECT})`;

export class SupabaseCartRepository implements CartRepository {
  /** Returns the user's cart id, or null when they have never added an item. */
  private static async findCartId(supabase: SupabaseClient, userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.id ?? null;
  }

  /** Returns the user's cart id, creating the cart row on first use. */
  private static async getOrCreateCartId(supabase: SupabaseClient, userId: string): Promise<string> {
    const existing = await SupabaseCartRepository.findCartId(supabase, userId);
    if (existing) return existing;

    const { data: created, error } = await supabase
      .from('carts')
      .insert({ user_id: userId })
      .select('id')
      .single();

    if (error || !created) {
      // Concurrent first add: the unique(user_id) index may have been won by
      // another request — re-read instead of failing.
      const retry = await SupabaseCartRepository.findCartId(supabase, userId);
      if (retry) return retry;
      throw error ?? new Error('Could not create cart');
    }
    return created.id;
  }

  async getItems(userId: string): Promise<CartItem[]> {
    const supabase = await createClient();
    const cartId = await SupabaseCartRepository.findCartId(supabase, userId);
    if (!cartId) return [];

    const { data, error } = await supabase
      .from('cart_items')
      .select(CART_ITEM_SELECT)
      .eq('cart_id', cartId);

    if (error) throw error;
    return (data ?? []).map((row) => mapCartItem(row as unknown as CartItemRow));
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const supabase = await createClient();
    const cartId = await SupabaseCartRepository.getOrCreateCartId(supabase, userId);

    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .maybeSingle();

    let saved: { id: string; cart_id: string; product_id: string; quantity: number };

    if (existing) {
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select('id, cart_id, product_id, quantity')
        .single();
      if (error) throw error;
      saved = data;
    } else {
      const { data, error } = await supabase
        .from('cart_items')
        .insert({ cart_id: cartId, product_id: productId, quantity })
        .select('id, cart_id, product_id, quantity')
        .single();
      if (error) throw error;
      saved = data;
    }

    const { data: productData } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('id', productId)
      .single();

    return {
      id: saved.id,
      productId: saved.product_id,
      product: productData ? mapProduct(productData as ProductRow) : ({} as Product),
      quantity: saved.quantity,
    };
  }

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<CartItem | null> {
    const supabase = await createClient();
    const cartId = await SupabaseCartRepository.findCartId(supabase, userId);
    if (!cartId) return null;

    const { data: cartRow, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('cart_id', cartId)
      .eq('product_id', productId)
      .select(CART_ITEM_SELECT)
      .maybeSingle();

    if (error || !cartRow) return null;
    return mapCartItem(cartRow as unknown as CartItemRow);
  }

  async removeItem(userId: string, productId: string): Promise<boolean> {
    const supabase = await createClient();
    const cartId = await SupabaseCartRepository.findCartId(supabase, userId);
    if (!cartId) return true;
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)
      .eq('product_id', productId);
    return !error;
  }

  async clear(userId: string): Promise<void> {
    const supabase = await createClient();
    const cartId = await SupabaseCartRepository.findCartId(supabase, userId);
    if (!cartId) return;
    await supabase.from('cart_items').delete().eq('cart_id', cartId);
  }
}
