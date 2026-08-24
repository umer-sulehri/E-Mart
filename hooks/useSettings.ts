'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

export interface PublicStoreSettings {
  taxRate: number;
  shippingFee: number;
  freeShippingThreshold: number;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  supportHours: string;
}

/** Admin-managed store settings that are safe to expose publicly. */
export function usePublicSettings() {
  return useQuery({
    queryKey: ['storeSettings'],
    queryFn: () => apiFetch<PublicStoreSettings>('/settings/public'),
    staleTime: 5 * 60 * 1000,
  });
}
