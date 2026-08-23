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
  const order = await OrderRepository.findById(id);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (order.userId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'You do not have permission to cancel this order' }, { status: 403 });
  }
  if (user.role !== 'admin' && !['pending', 'confirmed'].includes(order.status)) {
    return NextResponse.json({ error: 'Order can no longer be cancelled' }, { status: 400 });
  }

  try {
    const cancelled = await OrderRepository.cancel(id);
    if (!cancelled) {
      return NextResponse.json({ error: 'Order cannot be cancelled' }, { status: 400 });
    }
    return NextResponse.json({ order: cancelled }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Order not found or cannot be cancelled' },
      { status: 404 },
    );
  }
}
