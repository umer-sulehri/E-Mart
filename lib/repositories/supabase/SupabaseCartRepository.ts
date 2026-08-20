import { CartItem, Product, Category } from '@/lib/types';
import { CartRepository } from '../contracts/CartRepository';
import { createClient } from '@/lib/supabase/server';

interface CartItemRow {
  id: string;
  user_id: string;
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

export class SupabaseCartRepository implements CartRepository {
  async getItems(userId: string): Promise<CartItem[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('cart_items')
      .select(`id, user_id, product_id, quantity, products(${PRODUCT_SELECT})`)
      .eq('user_id', userId);

    if (error) throw error;
    return (data ?? []).map((row) => mapCartItem(row as unknown as CartItemRow));
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    let cartRow;

    if (existing) {
      const newQty = existing.quantity + quantity;
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', existing.id)
        .select('id, user_id, product_id, quantity')
        .single();
      if (error) throw error;
      cartRow = data;
    } else {
      const { data, error } = await supabase
        .from('cart_items')
        .insert({ user_id: userId, product_id: productId, quantity })
        .select('id, user_id, product_id, quantity')
        .single();
      if (error) throw error;
      cartRow = data;
    }

    const { data: productData } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('id', productId)
      .single();

    return {
      id: cartRow.id,
      productId: cartRow.product_id,
      product: productData ? mapProduct(productData as ProductRow) : ({} as Product),
      quantity: cartRow.quantity,
    };
  }

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<CartItem | null> {
    const supabase = await createClient();

    const { data: cartRow, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('product_id', productId)
      .select('id, user_id, product_id, quantity')
      .single();

    if (error || !cartRow) return null;

    const { data: productData } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('id', productId)
      .single();

    return {
      id: cartRow.id,
      productId: cartRow.product_id,
      product: productData ? mapProduct(productData as ProductRow) : ({} as Product),
      quantity: cartRow.quantity,
    };
  }

  async removeItem(userId: string, productId: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    return !error;
  }

  async clear(userId: string): Promise<void> {
    const supabase = await createClient();
    await supabase.from('cart_items').delete().eq('user_id', userId);
  }
}
