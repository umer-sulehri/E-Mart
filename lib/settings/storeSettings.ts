import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/optional';

export interface StoreSettings {
  taxRate: number; // e.g. 0.05 for 5%
  shippingFee: number; // flat PKR
  freeShippingThreshold: number; // subtotal at/above which shipping is free
  commissionRate: number; // platform cut of seller sales, e.g. 0.1 for 10%
  autoApproveProducts: boolean; // skip admin moderation for new seller products
  contactPhone: string; // shown on the contact page and footer
  contactEmail: string; // customer-facing support address
  contactAddress: string; // physical/registered office line
  supportHours: string; // e.g. "Monday – Saturday, 9am – 9pm (PKT)"
}

export const DEFAULT_SETTINGS: StoreSettings = {
  taxRate: 0,
  shippingFee: 150,
  freeShippingThreshold: 2000,
  commissionRate: 0.1,
  autoApproveProducts: false,
  contactPhone: '+92 300 0000000',
  contactEmail: 'support@e-mart.app',
  contactAddress: 'Lahore, Pakistan',
  supportHours: 'Monday – Saturday, 9am – 9pm (PKT)',
};

/**
 * In-memory overrides written by the admin settings API. Survives between
 * requests on a warm serverless instance even if the DB table is missing.
 */
const overrides: Partial<StoreSettings> = {};

async function readDbSettings(): Promise<Partial<StoreSettings>> {
  if (!isSupabaseConfigured()) return {};
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('site_settings').select('key, value');
    if (error || !data) return {};
    const result: Partial<StoreSettings> = {};
    for (const row of data) {
      const key = row.key as keyof StoreSettings;
      const value = row.value as unknown;
      if (key in DEFAULT_SETTINGS && typeof value === typeof DEFAULT_SETTINGS[key]) {
        result[key] = value as never;
      }
    }
    return result;
  } catch {
    return {};
  }
}

/** Effective store settings: defaults <- db row overrides <- runtime admin overrides. */
export async function getStoreSettings(): Promise<StoreSettings> {
  const fromDb = await readDbSettings();
  return { ...DEFAULT_SETTINGS, ...fromDb, ...overrides };
}

/** Persist an admin update: memory immediately, DB best-effort. */
export async function updateStoreSettings(patch: Partial<StoreSettings>): Promise<void> {
  Object.assign(overrides, patch);
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createAdminClient();
    const rows = Object.entries(patch)
      .filter(([key]) => key in DEFAULT_SETTINGS)
      .map(([key, value]) => ({ key, value }));
    if (rows.length === 0) return;
    await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
  } catch {
    // Table may not exist yet — the in-memory override still applies.
  }
}

export interface TotalsBreakdown {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

/** Round to whole rupees to avoid float artifacts. */
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeTotals(
  subtotal: number,
  settings: StoreSettings,
  discount = 0
): TotalsBreakdown {
  const safeDiscount = Math.min(Math.max(0, round(discount)), subtotal);
  const discountedSubtotal = subtotal - safeDiscount;
  const shipping =
    discountedSubtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
  const tax = round(discountedSubtotal * settings.taxRate);
  return {
    subtotal: round(subtotal),
    discount: safeDiscount,
    shipping,
    tax,
    total: round(discountedSubtotal + shipping + tax),
  };
}
