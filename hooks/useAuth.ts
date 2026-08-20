import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { User } from '@/lib/types';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => apiFetch<{ user: User | null }>('/auth/me'),
    select: (data) => data.user,
  });
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: (identifier: string) =>
      apiFetch<{ message: string }>('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ identifier }),
      }),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (data: { phone: string; otp: string }) =>
      apiFetch<{ user: User; token: string }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ identifier: data.phone, code: data.otp }),
      }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData(['currentUser'], null);
      queryClient.clear();
    },
  });
}
