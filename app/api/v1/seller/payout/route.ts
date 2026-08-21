import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import { getEarningsSummary, getPayoutsForSeller } from '@/lib/sellers/payoutService';

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'seller' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [summary, payouts] = await Promise.all([
    getEarningsSummary(user.id),
    getPayoutsForSeller(user.id),
  ]);

  return NextResponse.json({ summary, payouts }, { status: 200 });
}
