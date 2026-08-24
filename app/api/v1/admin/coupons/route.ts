import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/optional';
import { requireAdmin } from '@/lib/auth/requireAdmin';

const couponSchema = z.object({
  code: z.string().trim().min(2).max(32).regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, - and _ only'),
  type: z.enum(['percent', 'flat']),
  value: z.number().positive(),
  minSubtotal: z.number().min(0),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ coupons: [] }, { status: 200 });
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(
      {
        coupons: (data ?? []).map((c) => ({
          id: c.id,
          code: c.code,
          type: c.type,
          value: c.value,
          minSubtotal: c.min_subtotal,
          maxRedemptions: c.max_redemptions,
          timesUsed: c.times_used,
          expiresAt: c.expires_at,
          isActive: c.is_active,
          createdAt: c.created_at,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /admin/coupons error:', error);
    return NextResponse.json({ error: 'Failed to load coupons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.type === 'percent' && parsed.data.value > 90) {
    return NextResponse.json({ error: 'Percent discounts cannot exceed 90%.' }, { status: 400 });
  }

  const d = parsed.data;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        code: d.code.toUpperCase(),
        type: d.type,
        value: d.value,
        min_subtotal: d.minSubtotal,
        max_redemptions: d.maxRedemptions ?? null,
        expires_at: d.expiresAt || null,
        is_active: d.isActive ?? true,
      })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ coupon: data }, { status: 201 });
  } catch (error) {
    const message = (error as { code?: string; message?: string })?.message ?? '';
    if ((error as { code?: string })?.code === '23505') {
      return NextResponse.json({ error: 'A coupon with this code already exists.' }, { status: 409 });
    }
    console.error('POST /admin/coupons error:', message || error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
