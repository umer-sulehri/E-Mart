import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  if (!body.orderId || typeof body.amount !== 'number' || !body.method) {
    return NextResponse.json({ error: 'orderId, amount, and method are required' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    transactionId: `txn-${Date.now()}`,
    orderId: body.orderId,
    amount: body.amount,
    method: body.method,
  }, { status: 200 });
}
