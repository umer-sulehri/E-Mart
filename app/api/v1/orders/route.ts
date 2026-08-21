import { NextRequest, NextResponse } from 'next/server';
import { OrderRepository, ProductRepository, CartRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';
import { notifyNewOrder } from '@/lib/notifications/dispatch';

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await OrderRepository.findByUser(user.id);
  return NextResponse.json({ orders }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'items is required and must be non-empty' }, { status: 400 });
  }
  if (!body.address || typeof body.address !== 'string') {
    return NextResponse.json({ error: 'address is required' }, { status: 400 });
  }
  if (!body.paymentMethod || typeof body.paymentMethod !== 'string') {
    return NextResponse.json({ error: 'paymentMethod is required' }, { status: 400 });
  }

  // Snapshot product data for each item
  const orderItems: { productId: string; productName: string; productImage: string; price: number; quantity: number }[] = [];
  let total = 0;

  for (const item of body.items) {
    const product = await ProductRepository.findById(item.productId);
    if (!product) {
      return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
    }
    const qty = typeof item.quantity === 'number' ? item.quantity : 1;
    orderItems.push({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0] ?? '',
      price: product.price,
      quantity: qty,
    });
    total += product.price * qty;
  }

  const order = await OrderRepository.create({
    userId: user.id,
    items: orderItems,
    address: body.address,
    paymentMethod: body.paymentMethod,
    total,
  });

  await CartRepository.clear(user.id);

  void notifyNewOrder(user, order.id);

  return NextResponse.json({ order }, { status: 201 });
}
