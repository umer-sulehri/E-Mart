import { NextRequest, NextResponse } from 'next/server';
import { verifyJazzCashCallback, markPaymentCompleted } from '@/lib/payments/paymentService';

/**
 * JazzCash IPN posts pp_* form fields. Verify the secure hash before
 * marking the payment complete.
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';
  let fields: Record<string, string> = {};

  if (contentType.includes('application/json')) {
    fields = (await request.json()) as Record<string, string>;
  } else {
    const form = await request.formData();
    for (const [key, value] of form.entries()) {
      fields[key] = String(value);
    }
  }

  if (!verifyJazzCashCallback(fields)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const responseCode = fields.pp_ResponseCode;
  if (responseCode === '000' || responseCode === '121') {
    await markPaymentCompleted({
      provider: 'jazzcash',
      transactionId: fields.pp_TxnRefNo,
      orderId: fields.ppmpf_1,
    });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
