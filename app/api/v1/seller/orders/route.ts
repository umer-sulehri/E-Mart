import { NextResponse } from 'next/server';
import { ProductRepository, OrderRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';

async function requireSeller() {
  const user = await getSession();
  if (!user) throw new Error('Unauthorized');
  if (user.role !== 'seller' && user.role !== 'admin') throw new Error('Forbidden');
  return user;
}

export async function GET() {
  try {
    const user = await requireSeller();

    const { products } = await ProductRepository.findAll({ sellerId: user.id });
    const sellerProductIds = new Set(products.map((p) => p.id));

    if (sellerProductIds.size === 0) {
      return NextResponse.json({ orders: [] }, { status: 200 });
    }

    const allOrders = await OrderRepository.findAll();
    const sellerOrders = allOrders.filter((order) =>
      order.items.some((item) => sellerProductIds.has(item.productId))
    );

    return NextResponse.json({ orders: sellerOrders }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }
}
