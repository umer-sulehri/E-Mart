import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/getSession';
import { requestPayout, PayoutMethod } from '@/lib/sellers/payoutService';

const schema = z.object({
  amount: z.number().positive(),
  method: z.enum(['bank_transfer', 'stripe_connect', 'jazzcash']).default('bank_transfer'),
});

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'seller' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await requestPayout(
    user.id,
    parsed.data.amount,
    parsed.data.method as PayoutMethod
  );

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ payout: result.payout }, { status: 201 });
}
