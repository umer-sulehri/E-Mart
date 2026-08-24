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

export function useLogin() {
  return useMutation({
    mutationFn: (data: { email: string; password: string; rememberMe?: boolean }) =>
      apiFetch<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password: string;
      userType: 'customer' | 'seller';
      phone?: string;
    }) =>
      apiFetch<{ verified?: boolean; verificationRequired?: boolean }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) =>
      apiFetch<{ success: boolean; message?: string }>('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
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
