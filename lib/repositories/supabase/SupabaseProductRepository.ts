import { Product, Category } from '@/lib/types';
import { ProductRepository, ProductFilters } from '../contracts/ProductRepository';
import { createClient } from '@/lib/supabase/server';

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
  seller_id?: string;
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

function mapRow(row: ProductRow): Product {  const category: Category = row.categories
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
    sellerId: row.seller_id,
  };
}

function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()]/g, ' ').trim().slice(0, 80);
}

export class SupabaseProductRepository implements ProductRepository {
  async findAll(filters?: ProductFilters, page: number = 1, limit: number = 20): Promise<{ products: Product[]; total: number }> {
    const supabase = await createClient();

    let query = supabase
      .from('products')
      .select('*, categories(*), product_images(image_url, sort_order)', { count: 'exact' });

    if (filters) {
      if (filters.ids?.length) {
        query = query.in('id', filters.ids);
      }
      if (filters.category) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .or(`slug.eq.${filters.category},id.eq.${filters.category}`)
          .single();

        if (cat) {
          const { data: children } = await supabase
            .from('categories')
            .select('id')
            .eq('parent_id', cat.id);

          const ids = [cat.id, ...(children?.map((c) => c.id) ?? [])];
          query = query.in('category_id', ids);
        } else {
          query = query.eq('category_id', filters.category);
        }
      }
      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.search) {
        const term = sanitizeSearchTerm(filters.search);
        if (term) {
          query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,tags.cs.{${term}}`);
        }
      }
      if (filters.sort) {
        switch (filters.sort) {
          case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
          case 'rating':
            query = query.order('rating', { ascending: false });
            break;
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
        }
      }
      if (filters.sellerId) {
        query = query.eq('seller_id', filters.sellerId);
      }
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, count, error } = await query.range(from, to);

    if (error) throw error;

    return {
      products: (data ?? []).map(mapRow),
      total: count ?? 0,
    };
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*), product_images(image_url, sort_order)')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return mapRow(data as ProductRow);
  }

  async findById(id: string): Promise<Product | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*), product_images(image_url, sort_order)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapRow(data as ProductRow);
  }

  private static toInsertPayload(data: Omit<Product, 'id' | 'createdAt' | 'rating' | 'reviewCount'>) {
    return {
      slug: data.slug,
      name: data.name,
      name_urdu: data.nameUrdu,
      description: data.description,
      description_urdu: data.descriptionUrdu,
      price: data.price,
      original_price: data.originalPrice,
      category_id: data.categoryId,
      stock: data.stock,
      tags: data.tags,
      is_featured: data.isFeatured,
      is_new: data.isNew,
      seller_id: data.sellerId,
    };
  }

  async create(data: Omit<Product, 'id' | 'createdAt' | 'rating' | 'reviewCount'>): Promise<Product> {
    const supabase = await createClient();

    const { images } = data;
    const { data: row, error } = await supabase
      .from('products')
      .insert({ ...SupabaseProductRepository.toInsertPayload(data), rating: 0, review_count: 0 })
      .select('*, categories(*), product_images(image_url, sort_order)')
      .single();

    if (error) throw error;

    if (images.length > 0) {
      const imageRows = images.map((url, i) => ({
        product_id: row.id,
        image_url: url,
        sort_order: i,
      }));
      await supabase.from('product_images').insert(imageRows);
      row.product_images = imageRows.map((r) => ({ image_url: r.image_url, sort_order: r.sort_order }));
    }

    return mapRow(row as ProductRow);
  }

  async createBulk(products: Omit<Product, 'id' | 'createdAt' | 'rating' | 'reviewCount'>[]): Promise<Product[]> {
    if (products.length === 0) return [];

    const supabase = await createClient();

    const inserts = products.map((data) => ({
      ...SupabaseProductRepository.toInsertPayload(data),
      rating: 0,
      review_count: 0,
    }));
    const { data: rows, error } = await supabase
      .from('products')
      .insert(inserts)
      .select('*, categories(*), product_images(image_url, sort_order)');
    if (error) throw error;

    const imagesByProductId = new Map<string, ProductImageRow[]>();
    const imageRows = products.flatMap((data, i) =>
      data.images.map((url, j) => ({ product_id: rows[i].id, image_url: url, sort_order: j })),
    );
    if (imageRows.length > 0) {
      const { error: imgError } = await supabase.from('product_images').insert(imageRows);
      if (imgError) throw imgError;
      for (const r of imageRows) {
        const list = imagesByProductId.get(r.product_id) ?? [];
        list.push({ image_url: r.image_url, sort_order: r.sort_order });
        imagesByProductId.set(r.product_id, list);
      }
    }

    return rows.map((row) =>
      mapRow({ ...row, product_images: imagesByProductId.get(row.id) ?? [] } as ProductRow),
    );
  }

  async update(id: string, data: Partial<Product>): Promise<Product | null> {
    const supabase = await createClient();

    const { images, ...rest } = data;
    const updatePayload: Record<string, unknown> = {};
    if (rest.slug !== undefined) updatePayload.slug = rest.slug;
    if (rest.name !== undefined) updatePayload.name = rest.name;
    if (rest.nameUrdu !== undefined) updatePayload.name_urdu = rest.nameUrdu;
    if (rest.description !== undefined) updatePayload.description = rest.description;
    if (rest.descriptionUrdu !== undefined) updatePayload.description_urdu = rest.descriptionUrdu;
    if (rest.price !== undefined) updatePayload.price = rest.price;
    if (rest.originalPrice !== undefined) updatePayload.original_price = rest.originalPrice;
    if (rest.categoryId !== undefined) updatePayload.category_id = rest.categoryId;
    if (rest.stock !== undefined) updatePayload.stock = rest.stock;
    if (rest.tags !== undefined) updatePayload.tags = rest.tags;
    if (rest.isFeatured !== undefined) updatePayload.is_featured = rest.isFeatured;
    if (rest.isNew !== undefined) updatePayload.is_new = rest.isNew;

    if (Object.keys(updatePayload).length > 0) {
      const { error } = await supabase.from('products').update(updatePayload).eq('id', id);
      if (error) throw error;
    }

    if (images !== undefined) {
      await supabase.from('product_images').delete().eq('product_id', id);
      if (images.length > 0) {
        const imageRows = images.map((url, i) => ({
          product_id: id,
          image_url: url,
          sort_order: i,
        }));
        await supabase.from('product_images').insert(imageRows);
      }
    }

    const { data: row, error } = await supabase
      .from('products')
      .select('*, categories(*), product_images(image_url, sort_order)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapRow(row as ProductRow);
  }

  async delete(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase.from('products').delete().eq('id', id);
    return !error;
  }

  async search(query: string): Promise<Product[]> {
    const term = sanitizeSearchTerm(query);
    if (!term) return [];
    return (await this.findAll({ search: term }, 1, 20)).products;
  }
}
