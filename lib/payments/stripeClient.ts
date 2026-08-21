import crypto from 'crypto';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

export interface StripeCheckoutSessionResult {
  id: string;
  url: string | null;
}

function encodeForm(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

async function stripeRequest<T>(
  path: string,
  body?: Record<string, string>
): Promise<T> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('Stripe is not configured');

  const res = await fetch(`${STRIPE_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? encodeForm(body) : undefined,
  });

  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(json.error?.message || `Stripe request failed (${res.status})`);
  }
  return json;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export async function createCheckoutSession(params: {
  orderId: string;
  orderNumber: string;
  amountMinor: number;
  currency: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<StripeCheckoutSessionResult> {
  const body: Record<string, string> = {
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.orderId,
    'metadata[order_id]': params.orderId,
    'metadata[order_number]': params.orderNumber,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': params.currency.toLowerCase(),
    'line_items[0][price_data][unit_amount]': String(params.amountMinor),
    'line_items[0][price_data][product_data][name]': `Order ${params.orderNumber}`,
  };
  if (params.customerEmail) {
    body.customer_email = params.customerEmail;
  }

  return stripeRequest<StripeCheckoutSessionResult>('/checkout/sessions', body);
}

export async function createRefund(paymentIntentId: string): Promise<{ id: string }> {
  return stripeRequest<{ id: string }>('/refunds', { payment_intent: paymentIntentId });
}

/**
 * Verifies a Stripe webhook signature manually (no SDK dependency).
 * Signature header format: t=timestamp,v1=signature
 */
export function verifyStripeWebhook(
  payload: string,
  signatureHeader: string | null
): { valid: boolean; event: unknown } {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return { valid: false, event: null };

  const parts = signatureHeader.split(',').reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) {
      acc[key] = acc[key] ? [...acc[key], value] : [value];
    }
    return acc;
  }, {});

  const timestamp = parts.t?.[0];
  const signatures = parts.v1 ?? [];
  if (!timestamp || signatures.length === 0) return { valid: false, event: null };

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  const isValid = signatures.some((sig) => {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });

  if (!isValid) return { valid: false, event: null };

  try {
    return { valid: true, event: JSON.parse(payload) };
  } catch {
    return { valid: false, event: null };
  }
}
