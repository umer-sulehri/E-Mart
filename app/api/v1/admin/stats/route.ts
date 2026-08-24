import { NextResponse } from 'next/server';
import { ProductRepository, OrderRepository, UserRepository } from '@/lib/repositories/index';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  const [productsResult, orders, users] = await Promise.all([
    ProductRepository.findAll({ status: 'all' }),
    OrderRepository.findAll(),
    UserRepository.findAll(),
  ]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  return NextResponse.json(
    {
      totalProducts: productsResult.total,
      totalOrders: orders.length,
      totalUsers: users.length,
      totalRevenue,
    },
    { status: 200 },
  );
}
