import { NextRequest, NextResponse } from 'next/server';
import { CartRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await CartRepository.getItems(user.id);
  const total = items.reduce((sum: number, i: { product: { price: number }; quantity: number }) => sum + i.product.price * i.quantity, 0);
  return NextResponse.json({ items, total }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  if (!body.productId || typeof body.productId !== 'string') {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }
  const quantity = typeof body.quantity === 'number' ? body.quantity : 1;

  try {
    const item = await CartRepository.addItem(user.id, body.productId, quantity);
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
