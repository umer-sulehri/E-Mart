import { NextRequest, NextResponse } from 'next/server';
import { OrderRepository, UserRepository } from '@/lib/repositories/index';
import { OrderStatus } from '@/lib/types';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { dispatchOrderStatusNotifications } from '@/lib/notifications/dispatch';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  const { id } = await params;
  const order = await OrderRepository.findById(id);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  return NextResponse.json({ order }, { status: 200 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const validStatuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!body.status || !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    const order = await OrderRepository.updateStatus(id, body.status);
    if (order) {
      const customer = order.userId ? await UserRepository.findById(order.userId) : null;
      if (customer) {
        void dispatchOrderStatusNotifications(customer, order, body.status as OrderStatus);
      }
    }
    return NextResponse.json({ order }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
}
