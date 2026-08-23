import { Banner, BannerSlot } from '@/lib/types';
import { BannerRepository } from '../contracts/BannerRepository';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

function mapRow(row: Record<string, unknown>): Banner {
  return {
    id: row.id as string,
    slot: (row.slot as BannerSlot) ?? 'hero',
    title: row.title as string,
    subtitle: (row.subtitle as string) ?? undefined,
    description: (row.description as string) ?? undefined,
    imageUrl: (row.image_url as string) ?? undefined,
    badgeText: (row.badge_text as string) ?? undefined,
    ctaLabel: (row.cta_label as string) ?? undefined,
    ctaHref: (row.cta_href as string) ?? undefined,
    sortOrder: (row.sort_order as number) ?? 0,
    isActive: (row.is_active as boolean) ?? true,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function isMissingTable(error: { message?: string; code?: string }): boolean {
  return error.code === '42P01' || /relation .* does not exist|schema cache/i.test(error.message ?? '');
}

function toInsertPayload(data: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    slot: data.slot,
    title: data.title,
    subtitle: data.subtitle ?? null,
    description: data.description ?? null,
    image_url: data.imageUrl ?? null,
    badge_text: data.badgeText ?? null,
    cta_label: data.ctaLabel ?? null,
    cta_href: data.ctaHref ?? null,
    sort_order: data.sortOrder,
    is_active: data.isActive,
  };
}

export class SupabaseBannerRepository implements BannerRepository {
  async findAll(): Promise<Banner[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('site_banners')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return (data ?? []).map(mapRow);
  }

  async findActive(): Promise<Banner[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('site_banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return (data ?? []).map(mapRow);
  }

  async findBySlot(slot: BannerSlot): Promise<Banner[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('site_banners')
      .select('*')
      .eq('slot', slot)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
    return (data ?? []).map(mapRow);
  }

  async findById(id: string): Promise<Banner | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('site_banners')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error && !isMissingTable(error)) throw error;
    if (data) return mapRow(data);
    // RLS may hide rows from non-admin reads; fall back to the admin client.
    const admin = await createAdminClient();
    const { data: adminRow } = await admin.from('site_banners').select('*').eq('id', id).maybeSingle();
    if (!adminRow && error && isMissingTable(error)) return null;
    return adminRow ? mapRow(adminRow) : null;
  }

  async create(data: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Promise<Banner> {
    let supabase = await createClient();
    let { data: row, error } = await supabase.from('site_banners').insert(toInsertPayload(data)).select().single();

    if ((error && /row-level security/i.test(error.message)) || !row) {
      const admin = await createAdminClient();
      const res = await admin.from('site_banners').insert(toInsertPayload(data)).select().single();
      row = res.data;
      error = res.error;
      supabase = admin;
    }
    if (error) throw error;
    return mapRow(row!);
  }

  async update(id: string, data: Partial<Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Banner> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.slot !== undefined) patch.slot = data.slot;
    if (data.title !== undefined) patch.title = data.title;
    if (data.subtitle !== undefined) patch.subtitle = data.subtitle;
    if (data.description !== undefined) patch.description = data.description;
    if (data.imageUrl !== undefined) patch.image_url = data.imageUrl;
    if (data.badgeText !== undefined) patch.badge_text = data.badgeText;
    if (data.ctaLabel !== undefined) patch.cta_label = data.ctaLabel;
    if (data.ctaHref !== undefined) patch.cta_href = data.ctaHref;
    if (data.sortOrder !== undefined) patch.sort_order = data.sortOrder;
    if (data.isActive !== undefined) patch.is_active = data.isActive;

    let supabase = await createClient();
    let before: Record<string, unknown> | null = null;
    try {
      const res = await supabase.from('site_banners').update(patch).eq('id', id).select().single();
      if (res.data) return mapRow(res.data);
    } catch {
      /* fall through to admin */
    }
    // Detect silent RLS no-op by re-reading with the admin client.
    const admin = await createAdminClient();
    const { data: after } = await admin.from('site_banners').select('*').eq('id', id).maybeSingle();
    before = after;
    if (!before) throw new Error('Banner not found');
    const res2 = await admin.from('site_banners').update(patch).eq('id', id).select().single();
    if (res2.error) throw res2.error;
    return mapRow(res2.data!);
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient();
    await supabase.from('site_banners').delete().eq('id', id);
    const admin = await createAdminClient();
    const { data: still } = await admin.from('site_banners').select('id').eq('id', id).maybeSingle();
    if (still) {
      const { error } = await admin.from('site_banners').delete().eq('id', id);
      if (error) throw error;
    }
  }
}
