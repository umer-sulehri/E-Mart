import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  if (!body.orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    orderId: body.orderId,
    method: 'cod',
    message: 'Cash on delivery confirmed',
  }, { status: 200 });
}
