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
    mutationFn: (data: { email: string; password: string }) =>
      apiFetch<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
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
    mutationFn: (data: {
      identifier: string;
      otp: string;
      purpose?: 'register' | 'reset';
      name?: string;
      userType?: 'customer' | 'seller';
      password?: string;
      contactPhone?: string;
    }) =>
      apiFetch<{ user: User; token: string }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier: data.identifier,
          code: data.otp,
          purpose: data.purpose,
          name: data.name,
          userType: data.userType,
          password: data.password,
          phone: data.contactPhone,
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
