import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/optional';

export interface CouponValidation {
  valid: boolean;
  reason?: string;
  code?: string;
  type?: 'percent' | 'flat';
  value?: number;
  discount: number;
}

interface CouponRow {
  id: string;
  code: string;
  type: 'percent' | 'flat';
  value: number;
  min_subtotal: number;
  max_redemptions: number | null;
  times_used: number;
  expires_at: string | null;
}

/**
 * Validate a coupon code against a subtotal and return the discount amount.
 * Falls back to a small built-in list when the coupons table is unavailable
 * so the flow still works in local development.
 */
export async function validateCoupon(rawCode: string, subtotal: number): Promise<CouponValidation> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, reason: 'Enter a coupon code.', discount: 0 };

  let coupon: CouponRow | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .maybeSingle();
      coupon = (data as CouponRow) ?? null;
    } catch {
      coupon = null;
    }
  }

  if (!coupon) {
    // Local/dev fallback so the feature is testable without migrations.
    const fallback: Record<string, { type: 'percent' | 'flat'; value: number; min_subtotal: number }> = {
      WELCOME10: { type: 'percent', value: 10, min_subtotal: 1000 },
      FLAT500: { type: 'flat', value: 500, min_subtotal: 5000 },
    };
    const found = fallback[code];
    if (!found) return { valid: false, reason: 'Invalid or expired coupon.', discount: 0 };
    coupon = {
      id: `local-${code}`,
      code,
      type: found.type,
      value: found.value,
      min_subtotal: found.min_subtotal,
      max_redemptions: null,
      times_used: 0,
      expires_at: null,
    };
  }

  if (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) {
    // not expired — continue
  } else {
    return { valid: false, reason: 'This coupon has expired.', discount: 0 };
  }

  if (coupon.max_redemptions != null && coupon.times_used >= coupon.max_redemptions) {
    return { valid: false, reason: 'This coupon has reached its usage limit.', discount: 0 };
  }

  if (subtotal < coupon.min_subtotal) {
    return {
      valid: false,
      reason: `Requires a minimum subtotal of Rs ${coupon.min_subtotal.toLocaleString()}.`,
      discount: 0,
    };
  }

  const discount =
    coupon.type === 'percent'
      ? Math.round(subtotal * (coupon.value / 100))
      : Math.min(coupon.value, subtotal);

  return { valid: true, code: coupon.code, type: coupon.type, value: coupon.value, discount };
}
