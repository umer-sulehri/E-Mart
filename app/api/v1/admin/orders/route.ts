import { NextRequest, NextResponse } from 'next/server';
import { OrderRepository } from '@/lib/repositories/index';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { OrderStatus } from '@/lib/types';

const VALID_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
  }

  const statusParam = request.nextUrl.searchParams.get('status');
  const search = request.nextUrl.searchParams.get('search')?.toLowerCase();

  let orders = await OrderRepository.findAll();

  if (statusParam && VALID_STATUSES.includes(statusParam as OrderStatus)) {
    orders = orders.filter((o) => o.status === statusParam);
  }
  if (search) {
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(search) ||
        o.items.some((i) => i.productName.toLowerCase().includes(search))
    );
  }

  return NextResponse.json({ orders, total: orders.length }, { status: 200 });
}
