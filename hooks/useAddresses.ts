'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

export interface SavedAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

export type AddressInput = Omit<SavedAddress, 'id'>;

export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: () => apiFetch<{ addresses: SavedAddress[] }>('/auth/addresses'),
    select: (data) => data.addresses ?? [],
    enabled,
    staleTime: 60_000,
  });
}

function useInvalidateAddresses() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['addresses'] });
}

export function useAddAddress() {
  const invalidate = useInvalidateAddresses();
  return useMutation({
    mutationFn: (data: AddressInput) =>
      apiFetch<{ address: SavedAddress }>('/auth/addresses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateAddress() {
  const invalidate = useInvalidateAddresses();
  return useMutation({
    mutationFn: ({ id, ...data }: AddressInput & { id: string }) =>
      apiFetch<{ address: SavedAddress }>(`/auth/addresses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteAddress() {
  const invalidate = useInvalidateAddresses();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/auth/addresses/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}
