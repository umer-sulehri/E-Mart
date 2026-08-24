import { ProductRepository, OrderRepository } from '@/lib/repositories/index';
import { getOptionalSupabase } from '@/lib/supabase/optional';
import { getStoreSettings } from '@/lib/settings/storeSettings';

/** Fallback when settings cannot be loaded; effective rate comes from store settings. */
export const PLATFORM_COMMISSION_RATE = 0.1;
export const MIN_PAYOUT_AMOUNT = 5000;

export type PayoutMethod = 'bank_transfer' | 'stripe_connect' | 'jazzcash';

export interface PayoutRecord {
  id: string;
  sellerId: string;
  amount: number;
  method: PayoutMethod;
  status: 'requested' | 'processing' | 'paid' | 'rejected';
  reference?: string;
  note?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface EarningsSummary {
  grossEarnings: number;
  commission: number;
  netEarnings: number;
  withdrawn: number;
  pendingWithdrawal: number;
  availableForPayout: number;
}

async function getPayouts(sellerId: string): Promise<PayoutRecord[]> {
  const supabase = await getOptionalSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('seller_payouts')
    .select('*')
    .eq('seller_id', sellerId)
    .order('requested_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map(mapPayoutRow);
}

function mapPayoutRow(row: Record<string, unknown>): PayoutRecord {
  return {
    id: row.id as string,
    sellerId: row.seller_id as string,
    amount: Number(row.amount),
    method: row.method as PayoutMethod,
    status: row.status as PayoutRecord['status'],
    reference: (row.reference as string) ?? undefined,
    note: (row.note as string) ?? undefined,
    requestedAt: row.requested_at as string,
    processedAt: (row.processed_at as string) ?? undefined,
  };
}

export async function getPayoutsForSeller(sellerId: string): Promise<PayoutRecord[]> {
  return getPayouts(sellerId);
}

async function getDeliveredNetEarnings(sellerId: string): Promise<number> {
  const { products } = await ProductRepository.findAll({ sellerId }, 1, 5000);
  const sellerProductIds = new Set(products.map((p) => p.id));
  if (sellerProductIds.size === 0) return 0;

  const allOrders = await OrderRepository.findAll();
  let gross = 0;
  for (const order of allOrders) {
    if (order.status !== 'delivered') continue;
    for (const item of order.items) {
      if (sellerProductIds.has(item.productId)) {
        gross += item.price * item.quantity;
      }
    }
  }
  const { commissionRate } = await getStoreSettings();
  return gross - gross * commissionRate;
}

export async function getEarningsSummary(sellerId: string): Promise<EarningsSummary> {
  const [netEarnings, payouts, settings] = await Promise.all([
    getDeliveredNetEarnings(sellerId),
    getPayouts(sellerId),
    getStoreSettings(),
  ]);
  const rate = settings.commissionRate;

  const withdrawn = payouts
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingWithdrawal = payouts
    .filter((p) => p.status === 'requested' || p.status === 'processing')
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    grossEarnings: Math.round(netEarnings / (1 - rate)),
    commission: Math.round(netEarnings / (1 - rate) - netEarnings),
    netEarnings: Math.round(netEarnings),
    withdrawn: Math.round(withdrawn),
    pendingWithdrawal: Math.round(pendingWithdrawal),
    availableForPayout: Math.round(netEarnings - withdrawn - pendingWithdrawal),
  };
}

export async function requestPayout(
  sellerId: string,
  amount: number,
  method: PayoutMethod
): Promise<{ success: boolean; message?: string; payout?: PayoutRecord }> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, message: 'Payout amount must be positive.' };
  }
  if (amount < MIN_PAYOUT_AMOUNT) {
    return { success: false, message: `Minimum payout amount is PKR ${MIN_PAYOUT_AMOUNT.toLocaleString()}.` };
  }

  const summary = await getEarningsSummary(sellerId);
  if (amount > summary.availableForPayout) {
    return {
      success: false,
      message: `Insufficient balance. Available for payout: PKR ${summary.availableForPayout.toLocaleString()}.`,
    };
  }

  const supabase = await getOptionalSupabase();
  if (!supabase) {
    return { success: false, message: 'Payout requests require a configured database.' };
  }

  const reference = `PO-${Date.now()}`;
  const { data, error } = await supabase
    .from('seller_payouts')
    .insert({ seller_id: sellerId, amount, method, status: 'requested', reference })
    .select()
    .single();

  if (error || !data) {
    return { success: false, message: 'Could not record the payout request. Please try again.' };
  }

  return { success: true, payout: mapPayoutRow(data as Record<string, unknown>) };
}
