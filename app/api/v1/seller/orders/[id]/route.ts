import { NextRequest, NextResponse } from 'next/server';
import { ProductRepository, OrderRepository, UserRepository } from '@/lib/repositories/index';
import { OrderStatus } from '@/lib/types';
import { getSession } from '@/lib/auth/getSession';
import { dispatchOrderStatusNotifications } from '@/lib/notifications/dispatch';

async function requireSeller() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  if (user.role !== 'seller' && user.role !== 'admin') throw new Error('Forbidden');
  return user;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSeller();
    const { id } = await params;

    const order = (await OrderRepository.findById(id)) ?? (await OrderRepository.findByIdUnscoped(id));
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { products } = await ProductRepository.findAll({ sellerId: user.id });
    const sellerProductIds = new Set(products.map((p) => p.id));
    const hasSellerProduct = order.items.some((item) => sellerProductIds.has(item.productId));

    if (!hasSellerProduct) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validStatuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await OrderRepository.updateStatus(id, body.status);
    if (updated) {
      const customer = updated.userId ? await UserRepository.findById(updated.userId) : null;
      if (customer) {
        void dispatchOrderStatusNotifications(customer, updated, body.status as OrderStatus);
      }
    }
    return NextResponse.json({ order: updated }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }
}
