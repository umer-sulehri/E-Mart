import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { OrderRepository } from '@/lib/repositories/index';
import { getSession } from '@/lib/auth/getSession';
import { initiatePayment } from '@/lib/payments/paymentService';

const bodySchema = z.object({
  orderId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  const order = await OrderRepository.findById(parsed.data.orderId);
  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (order.paymentMethod !== 'stripe') {
    return NextResponse.json({ error: 'Order was not placed with Stripe' }, { status: 400 });
  }

  const origin = request.nextUrl.origin;
  const result = await initiatePayment('stripe', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: order.total,
    currency: 'PKR',
    customerEmail: user.email,
    origin,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.message ?? 'Payment initiation failed', configured: result.configured },
      { status: result.configured ? 502 : 503 }
    );
  }

  return NextResponse.json(result, { status: 200 });
}
