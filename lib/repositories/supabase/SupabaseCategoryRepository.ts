import { Category } from '@/lib/types';
import { CategoryRepository } from '../contracts/CategoryRepository';
import { createClient } from '@/lib/supabase/server';

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  name_urdu?: string;
  icon: string;
  image?: string;
  parent_id?: string;
}

function mapCategory(row: CategoryRow, children?: Category[]): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameUrdu: row.name_urdu,
    icon: row.icon,
    image: row.image,
    parentId: row.parent_id,
    children,
  };
}

export class SupabaseCategoryRepository implements CategoryRepository {
  async findAll(): Promise<Category[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;

    const rows = (data ?? []) as CategoryRow[];
    const topLevel = rows.filter((r) => !r.parent_id);
    const byParent = new Map<string, CategoryRow[]>();

    for (const row of rows) {
      if (row.parent_id) {
        const list = byParent.get(row.parent_id) ?? [];
        list.push(row);
        byParent.set(row.parent_id, list);
      }
    }

    return topLevel.map((row) =>
      mapCategory(row, (byParent.get(row.id) ?? []).map((child) => mapCategory(child)))
    );
  }

  async findById(id: string): Promise<Category | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    const row = data as CategoryRow;
    const { data: children } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', id)
      .order('name');

    return mapCategory(row, (children ?? []).map((c) => mapCategory(c as CategoryRow)));
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;

    const row = data as CategoryRow;
    const { data: children } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', row.id)
      .order('name');

    return mapCategory(row, (children ?? []).map((c) => mapCategory(c as CategoryRow)));
  }

  async findChildren(parentId: string): Promise<Category[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('name');

    if (error) throw error;
    return (data ?? []).map((row) => mapCategory(row as CategoryRow));
  }

  async create(data: Omit<Category, 'id'>): Promise<Category> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from('categories')
      .insert({
        slug: data.slug,
        name: data.name,
        name_urdu: data.nameUrdu,
        icon: data.icon,
        image: data.image,
        parent_id: data.parentId,
      })
      .select()
      .single();

    if (error) throw error;
    return mapCategory(row as CategoryRow);
  }

  async update(id: string, data: Partial<Category>): Promise<Category | null> {
    const supabase = await createClient();

    const updatePayload: Record<string, unknown> = {};
    if (data.slug !== undefined) updatePayload.slug = data.slug;
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.nameUrdu !== undefined) updatePayload.name_urdu = data.nameUrdu;
    if (data.icon !== undefined) updatePayload.icon = data.icon;
    if (data.image !== undefined) updatePayload.image = data.image;
    if (data.parentId !== undefined) updatePayload.parent_id = data.parentId;

    const { data: row, error } = await supabase
      .from('categories')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !row) return null;
    return mapCategory(row as CategoryRow);
  }

  async delete(id: string): Promise<boolean> {
    const supabase = await createClient();
    await supabase.from('categories').delete().eq('parent_id', id);
    const { error } = await supabase.from('categories').delete().eq('id', id);
    return !error;
  }
}
