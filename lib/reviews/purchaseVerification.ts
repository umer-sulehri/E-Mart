import { isSupabaseConfigured } from '@/lib/supabase/optional';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Returns the set of user ids that have ordered the given product (any order
 * status). Uses the service-role client because purchase history spans all
 * users, which RLS-scoped reads cannot see. Never throws — an empty set means
 * "cannot verify" (local/dev mode or lookup failure).
 */
export async function getPurchaserIds(productId: string): Promise<Set<string>> {
  if (!isSupabaseConfigured()) return new Set();
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('order_items')
      .select('orders!inner(user_id)')
      .eq('product_id', productId);
    if (error) return new Set();
    const ids = new Set<string>();
    for (const row of data ?? []) {
      const orders = (row as { orders?: unknown }).orders;
      const list = Array.isArray(orders) ? orders : [orders];
      for (const entry of list) {
        const userId = (entry as { user_id?: string } | null)?.user_id;
        if (userId) ids.add(userId);
      }
    }
    return ids;
  } catch {
    return new Set();
  }
}
