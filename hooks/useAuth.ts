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

export function useRequestOtp() {
  return useMutation({
    mutationFn: (
      data:
        | string
        | {
            identifier: string;
            name: string;
            password: string;
            userType: 'customer' | 'seller';
            phone?: string;
          }
    ) => {
      const payload =
        typeof data === 'string'
          ? { identifier: data }
          : data;
      return apiFetch<{ message: string }>('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (data: {
      identifier: string;
      otp: string;
      purpose?: 'register' | 'reset';
    }) =>
      apiFetch<{ user: User; token: string }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: data.identifier,
          code: data.otp,
          purpose: data.purpose,
        }),
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
