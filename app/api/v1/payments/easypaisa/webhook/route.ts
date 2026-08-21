import { NextRequest, NextResponse } from 'next/server';
import { verifyEasyPaisaCallback, markPaymentCompleted } from '@/lib/payments/paymentService';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature =
    request.headers.get('signature') ??
    request.headers.get('x-signature') ??
    request.headers.get('hashedcredentials') ??
    '';

  if (!verifyEasyPaisaCallback(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const responseCode = String(body.responseCode ?? '');
  if (responseCode === '0000' || responseCode === '00') {
    await markPaymentCompleted({
      provider: 'easypaisa',
      transactionId: typeof body.transactionId === 'string' ? body.transactionId : undefined,
      orderId: typeof body.orderId === 'string' ? body.orderId : undefined,
    });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
