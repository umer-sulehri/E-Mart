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

    const allOrders = await OrderRepository.findAll();
    const sellerOrders = allOrders.filter((order) =>
      order.items.some((item) => sellerProductIds.has(item.productId))
    );

    let totalEarnings = 0;
    let totalItemsSold = 0;
    const earningsByProduct: Record<string, { name: string; earnings: number; quantity: number }> = {};

    for (const order of sellerOrders) {
      for (const item of order.items) {
        if (sellerProductIds.has(item.productId)) {
          const earnings = item.price * item.quantity;
          totalEarnings += earnings;
          totalItemsSold += item.quantity;

          if (!earningsByProduct[item.productId]) {
            const product = products.find((p) => p.id === item.productId);
            earningsByProduct[item.productId] = {
              name: product?.name ?? item.productName,
              earnings: 0,
              quantity: 0,
            };
          }
          earningsByProduct[item.productId].earnings += earnings;
          earningsByProduct[item.productId].quantity += item.quantity;
        }
      }
    }

    const deliveredOrders = sellerOrders.filter((o) => o.status === 'delivered');
    let deliveredEarnings = 0;
    for (const order of deliveredOrders) {
      for (const item of order.items) {
        if (sellerProductIds.has(item.productId)) {
          deliveredEarnings += item.price * item.quantity;
        }
      }
    }

    return NextResponse.json(
      {
        totalEarnings,
        deliveredEarnings,
        totalItemsSold,
        totalOrders: sellerOrders.length,
        deliveredOrders: deliveredOrders.length,
        products: Object.values(earningsByProduct),
      },
      { status: 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }
}
