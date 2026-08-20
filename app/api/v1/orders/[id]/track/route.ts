import { NextRequest, NextResponse } from 'next/server';
import { OrderRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';

export async function GET(
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

  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      estimatedDelivery: order.estimatedDelivery,
      items: order.items,
      total: order.total,
      createdAt: order.createdAt,
    },
  }, { status: 200 });
}
