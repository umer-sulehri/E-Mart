'use client';

import { useCallback, useEffect, useState } from 'react';
import { tryParseJson } from '@/lib/api';
import type { ProductQuota } from '@/components/seller/ProductQuotaBar';

interface QuotaResponse {
  success: boolean;
  error?: string;
  data?: ProductQuota;
}

/**
 * Daily product-upload allowance for the signed-in seller.
 *
 * A quota failure is intentionally non-fatal: the seller should still be able
 * to reach the upload form and find out at submit time (where a 429 is handled
 * explicitly), rather than being blocked by a side panel that failed to load.
 */
export function useProductQuota() {
  const [quota, setQuota] = useState<ProductQuota | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/seller/products/quota', { cache: 'no-store' });
      const json = await tryParseJson<QuotaResponse>(res);
      if (json?.success && json.data) {
        setQuota(json.data);
      }
    } catch {
      // Leave quota null; the UI hides the panel rather than showing a wrong number.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { quota, loading, refresh, setQuota };
}
