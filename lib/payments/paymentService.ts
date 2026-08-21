import crypto from 'crypto';
import { getOptionalSupabase } from '@/lib/supabase/optional';

export type PaymentProvider = 'cod' | 'stripe' | 'jazzcash' | 'easypaisa';

export interface PaymentInitiation {
  success: boolean;
  provider: PaymentProvider;
  configured: boolean;
  redirectUrl?: string;
  formActionUrl?: string;
  formFields?: Record<string, string>;
  transactionId?: string;
  message?: string;
}

export interface PaymentOrderContext {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
  origin: string;
}

const JAZZCASH_FORM_URL = 'https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform';
const EASYPAISA_INITIATE_URL =
  'https://easypay.easypaisa.com.pk/easypay-service/rest/v4/initiate-ma-transaction';

export const MIN_PAYOUT_THRESHOLD_PKR = 5000;

export function isJazzCashConfigured(): boolean {
  return !!(
    process.env.JAZZCASH_MERCHANT_ID &&
    process.env.JAZZCASH_PASSWORD &&
    process.env.JAZZCASH_INTEGRITY_SALT
  );
}

export function isEasyPaisaConfigured(): boolean {
  return !!(
    process.env.EASYPAISA_STORE_ID &&
    process.env.EASYPAISA_HASH_KEY
  );
}

export function isProviderConfigured(provider: PaymentProvider): boolean {
  switch (provider) {
    case 'cod':
      return true;
    case 'stripe':
      return !!process.env.STRIPE_SECRET_KEY;
    case 'jazzcash':
      return isJazzCashConfigured();
    case 'easypaisa':
      return isEasyPaisaConfigured();
  }
}

async function recordPayment(params: {
  orderId: string;
  amount: number;
  provider: PaymentProvider;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  failureReason?: string;
}): Promise<void> {
  const supabase = await getOptionalSupabase();
  if (!supabase) return;
  try {
    await supabase.from('payments').insert({
      order_id: params.orderId,
      amount: params.amount,
      method: params.provider,
      provider: params.provider,
      status: params.status,
      transaction_id: params.transactionId ?? null,
      failure_reason: params.failureReason ?? null,
    });
  } catch {
    // Payment logging must never break the payment flow.
  }
}

// ---------------------------------------------------------------------------
// Stripe (cards, international)
// ---------------------------------------------------------------------------
async function initiateStripe(ctx: PaymentOrderContext): Promise<PaymentInitiation> {
  const { createCheckoutSession } = await import('./stripeClient');
  const session = await createCheckoutSession({
    orderId: ctx.orderId,
    orderNumber: ctx.orderNumber,
    amountMinor: Math.round(ctx.amount * 100),
    currency: ctx.currency,
    customerEmail: ctx.customerEmail,
    successUrl: `${ctx.origin}/checkout/success?orderId=${ctx.orderId}`,
    cancelUrl: `${ctx.origin}/checkout?cancelled=1`,
  });

  await recordPayment({
    orderId: ctx.orderId,
    amount: ctx.amount,
    provider: 'stripe',
    status: 'pending',
    transactionId: session.id,
  });

  return {
    success: true,
    provider: 'stripe',
    configured: true,
    redirectUrl: session.url ?? undefined,
    transactionId: session.id,
  };
}

// ---------------------------------------------------------------------------
// JazzCash (Pakistan mobile wallet / cards)
// ---------------------------------------------------------------------------
function jazzCashHash(fields: Record<string, string>): string {
  const salt = process.env.JAZZCASH_INTEGRITY_SALT as string;
  const sorted = Object.keys(fields)
    .sort()
    .filter((k) => k.startsWith('pp_') && fields[k] !== '')
    .map((k) => fields[k]);
  const message = [salt, ...sorted].join('&');
  return crypto.createHmac('sha256', salt).update(message).digest('hex').toUpperCase();
}

async function initiateJazzCash(ctx: PaymentOrderContext): Promise<PaymentInitiation> {
  const now = new Date();
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
  const expiry = new Date(now.getTime() + 60 * 60 * 1000);

  const fields: Record<string, string> = {
    pp_Version: '1.1',
    pp_TxnType: 'MWALLET',
    pp_Language: 'EN',
    pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID as string,
    pp_Password: process.env.JAZZCASH_PASSWORD as string,
    pp_TxnRefNo: `T${Date.now()}`,
    pp_Amount: String(Math.round(ctx.amount * 100)),
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: fmt(now),
    pp_TxnExpiryDateTime: fmt(expiry),
    pp_BillReference: ctx.orderNumber,
    pp_Description: `E-Mart order ${ctx.orderNumber}`,
    pp_TxnPhone: ctx.customerPhone ?? '',
    pp_MobileID: ctx.customerPhone ?? '',
    ppmpf_1: ctx.orderId,
  };
  fields.pp_SecureHash = jazzCashHash(fields);

  await recordPayment({
    orderId: ctx.orderId,
    amount: ctx.amount,
    provider: 'jazzcash',
    status: 'pending',
    transactionId: fields.pp_TxnRefNo,
  });

  return {
    success: true,
    provider: 'jazzcash',
    configured: true,
    formActionUrl: JAZZCASH_FORM_URL,
    formFields: fields,
    transactionId: fields.pp_TxnRefNo,
  };
}

/**
 * Verifies a JazzCash IPN/callback by recomputing the secure hash.
 */
export function verifyJazzCashCallback(fields: Record<string, string>): boolean {
  if (!isJazzCashConfigured()) return false;
  const received = fields.pp_SecureHash;
  if (!received) return false;
  const rest: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (key !== 'pp_SecureHash') rest[key] = value;
  }
  return jazzCashHash(rest) === received.toUpperCase();
}

// ---------------------------------------------------------------------------
// EasyPaisa (Pakistan mobile wallet)
// ---------------------------------------------------------------------------
async function initiateEasyPaisa(ctx: PaymentOrderContext): Promise<PaymentInitiation> {
  const payload = {
    storeId: process.env.EASYPAISA_STORE_ID,
    orderId: ctx.orderNumber,
    transactionAmount: String(ctx.amount),
    mobileAccountNo: ctx.customerPhone ?? '',
    email: ctx.customerEmail ?? '',
  };

  const hashKey = process.env.EASYPAISA_HASH_KEY as string;
  const storeId = process.env.EASYPAISA_STORE_ID as string;
  const signature = crypto.createHmac('sha256', hashKey).update(JSON.stringify(payload)).digest('hex');
  const hashedCredentials = Buffer.from(`${storeId}:${hashKey}`).toString('base64');

  let transactionId = `EP-${Date.now()}`;
  try {
    const res = await fetch(EASYPAISA_INITIATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Credentials: storeId,
        HashedCredentials: hashedCredentials,
        Signature: signature,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = (await res.json()) as { transactionId?: string; responseCode?: string };
      if (data.transactionId) transactionId = data.transactionId;
    }
  } catch {
    // Fall back to redirect flow with locally generated reference.
  }

  await recordPayment({
    orderId: ctx.orderId,
    amount: ctx.amount,
    provider: 'easypaisa',
    status: 'pending',
    transactionId,
  });

  return {
    success: true,
    provider: 'easypaisa',
    configured: true,
    redirectUrl: `${ctx.origin}/checkout/easypaisa-confirm?orderId=${ctx.orderId}&ref=${transactionId}`,
    transactionId,
  };
}

/**
 * Verifies an EasyPaisa callback signature.
 */
export function verifyEasyPaisaCallback(rawBody: string, signature: string | null): boolean {
  if (!isEasyPaisaConfigured() || !signature) return false;
  const expected = crypto
    .createHmac('sha256', process.env.EASYPAISA_HASH_KEY as string)
    .update(rawBody)
    .digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Unified entry point
// ---------------------------------------------------------------------------
export async function initiatePayment(
  provider: PaymentProvider,
  ctx: PaymentOrderContext
): Promise<PaymentInitiation> {
  if (!isProviderConfigured(provider)) {
    return {
      success: false,
      provider,
      configured: false,
      message:
        provider === 'cod'
          ? 'Cash on delivery does not require configuration.'
          : `${provider} gateway is not configured. Add the required environment variables to enable it.`,
    };
  }

  try {
    switch (provider) {
      case 'cod':
        await recordPayment({ orderId: ctx.orderId, amount: ctx.amount, provider: 'cod', status: 'pending' });
        return {
          success: true,
          provider: 'cod',
          configured: true,
          message: 'Cash on delivery confirmed. Pay when you receive your order.',
        };
      case 'stripe':
        return await initiateStripe(ctx);
      case 'jazzcash':
        return await initiateJazzCash(ctx);
      case 'easypaisa':
        return await initiateEasyPaisa(ctx);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment initiation failed';
    await recordPayment({
      orderId: ctx.orderId,
      amount: ctx.amount,
      provider,
      status: 'failed',
      failureReason: message,
    });
    return { success: false, provider, configured: true, message };
  }
}

export async function markPaymentCompleted(params: {
  provider: PaymentProvider;
  transactionId?: string;
  orderId?: string;
}): Promise<void> {
  const supabase = await getOptionalSupabase();
  if (!supabase) return;
  try {
    let query = supabase
      .from('payments')
      .update({ status: 'completed', updated_at: new Date().toISOString() });
    query =
      params.orderId && params.orderId.length > 0
        ? query.eq('order_id', params.orderId)
        : query.eq('transaction_id', params.transactionId ?? '');
    await query;
  } catch {
    // Ignore logging failures.
  }
}
