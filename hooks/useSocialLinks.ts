import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { SocialLink } from '@/lib/types';

export function useSocialLinks() {
  return useQuery({
    queryKey: ['socialLinks'],
    queryFn: () => apiFetch<SocialLink[]>('/social-links'),
  });
}

export function useAdminSocialLinks() {
  return useQuery({
    queryKey: ['adminSocialLinks'],
    queryFn: () => apiFetch<SocialLink[]>('/admin/social-links'),
  });
}

export function useCreateSocialLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<SocialLink, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiFetch<{ link: SocialLink }>('/admin/social-links', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSocialLinks'] });
    },
  });
}

export function useUpdateSocialLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SocialLink> }) =>
      apiFetch<{ link: SocialLink }>(`/admin/social-links/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSocialLinks'] });
    },
  });
}

export function useDeleteSocialLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/admin/social-links/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSocialLinks'] });
    },
  });
}
