import { NextRequest, NextResponse } from 'next/server';
import { verifyStripeWebhook } from '@/lib/payments/stripeClient';
import { markPaymentCompleted } from '@/lib/payments/paymentService';

interface StripeEvent {
  type: string;
  data: {
    object: {
      id?: string;
      client_reference_id?: string;
      payment_intent?: string;
      metadata?: Record<string, string>;
    };
  };
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  const { valid, event } = verifyStripeWebhook(payload, signature);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const stripeEvent = event as StripeEvent;
  const object = stripeEvent.data?.object ?? {};
  const orderId = object.client_reference_id ?? object.metadata?.order_id;

  switch (stripeEvent.type) {
    case 'checkout.session.completed':
    case 'payment_intent.succeeded':
      await markPaymentCompleted({ provider: 'stripe', orderId, transactionId: object.id });
      break;
    case 'payment_intent.payment_failed':
    case 'charge.refunded':
      // Status stays pending/failed; refunds are handled by admin flow.
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
