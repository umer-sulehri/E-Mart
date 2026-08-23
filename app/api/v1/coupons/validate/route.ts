import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateCoupon } from '@/lib/coupons/couponService';

const bodySchema = z.object({
  code: z.string().trim().min(1).max(50),
  subtotal: z.number().nonnegative(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'code and subtotal are required' }, { status: 400 });
  }

  const result = await validateCoupon(parsed.data.code, parsed.data.subtotal);
  return NextResponse.json(result, { status: 200 });
}
