import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

export interface AdminCoupon {
  id: string;
  code: string;
  type: 'percent' | 'flat';
  value: number;
  minSubtotal: number;
  maxRedemptions: number | null;
  timesUsed: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt?: string;
}

export function useAdminCoupons() {
  return useQuery({
    queryKey: ['adminCoupons'],
    queryFn: () => apiFetch<{ coupons: AdminCoupon[] }>('/admin/coupons'),
    select: (data) => data.coupons,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/admin/coupons', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminCoupons'] }),
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch(`/admin/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminCoupons'] }),
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/coupons/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminCoupons'] }),
  });
}
