import { NextRequest, NextResponse } from 'next/server';
import { OrderRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const order = await OrderRepository.cancel(id);
    return NextResponse.json({ order }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Order not found or cannot be cancelled' },
      { status: 404 },
    );
  }
}
