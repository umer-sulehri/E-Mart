import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { Banner } from '@/lib/types';

export function useBanners() {
  return useQuery({
    queryKey: ['banners'],
    queryFn: () => apiFetch<Banner[]>('/banners'),
  });
}

export function useAdminBanners() {
  return useQuery({
    queryKey: ['adminBanners'],
    queryFn: () => apiFetch<Banner[]>('/admin/banners'),
  });
}

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<{ banner: Banner }>('/admin/banners', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminBanners'] });
      qc.invalidateQueries({ queryKey: ['banners'] });
    },
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiFetch<{ banner: Banner }>(`/admin/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminBanners'] });
      qc.invalidateQueries({ queryKey: ['banners'] });
    },
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/admin/banners/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminBanners'] });
      qc.invalidateQueries({ queryKey: ['banners'] });
    },
  });
}
