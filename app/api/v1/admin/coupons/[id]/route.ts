import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/optional';
import { requireAdmin } from '@/lib/auth/requireAdmin';

const patchSchema = z.object({
  value: z.number().positive().optional(),
  minSubtotal: z.number().min(0).optional(),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Coupon management requires a configured Supabase backend.' }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const patch: Record<string, unknown> = {};
  if (d.value !== undefined) patch.value = d.value;
  if (d.minSubtotal !== undefined) patch.min_subtotal = d.minSubtotal;
  if (d.maxRedemptions !== undefined) patch.max_redemptions = d.maxRedemptions;
  if (d.expiresAt !== undefined) patch.expires_at = d.expiresAt || null;
  if (d.isActive !== undefined) patch.is_active = d.isActive;

  const { id } = await params;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('coupons')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    return NextResponse.json({ coupon: data }, { status: 200 });
  } catch (error) {
    console.error('PATCH /admin/coupons/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Coupon management requires a configured Supabase backend.' }, { status: 503 });
  }

  const { id } = await params;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('DELETE /admin/coupons/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
