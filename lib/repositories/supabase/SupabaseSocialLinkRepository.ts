import { SocialLink } from '@/lib/types';
import { SocialLinkRepository } from '../contracts/SocialLinkRepository';
import { createClient } from '@/lib/supabase/server';

function mapRow(row: Record<string, unknown>): SocialLink {
  return {
    id: row.id as string,
    platform: row.platform as string,
    label: row.label as string,
    url: row.url as string,
    icon: row.icon as string,
    isActive: (row.is_active as boolean) ?? true,
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export class SupabaseSocialLinkRepository implements SocialLinkRepository {
  async findAll(): Promise<SocialLink[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  }

  async findActive(): Promise<SocialLink[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  }

  async findById(id: string): Promise<SocialLink | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapRow(data) : null;
  }

  async create(data: Omit<SocialLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<SocialLink> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from('social_links')
      .insert({
        platform: data.platform,
        label: data.label,
        url: data.url,
        icon: data.icon,
        is_active: data.isActive,
        sort_order: data.sortOrder,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapRow(row);
  }

  async update(id: string, data: Partial<SocialLink>): Promise<SocialLink | null> {
    const supabase = await createClient();
    const updates: Record<string, unknown> = {};
    if (data.platform !== undefined) updates.platform = data.platform;
    if (data.label !== undefined) updates.label = data.label;
    if (data.url !== undefined) updates.url = data.url;
    if (data.icon !== undefined) updates.icon = data.icon;
    if (data.isActive !== undefined) updates.is_active = data.isActive;
    if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder;

    const { data: row, error } = await supabase
      .from('social_links')
      .update(updates)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return row ? mapRow(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
      .from('social_links')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }

  async updateSortOrder(id: string, sortOrder: number): Promise<SocialLink | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('social_links')
      .update({ sort_order: sortOrder })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? mapRow(data) : null;
  }
}
