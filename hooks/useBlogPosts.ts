import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { BlogPost } from '@/lib/types';

export function useBlogPosts() {
  return useQuery({
    queryKey: ['blogPosts'],
    queryFn: () => apiFetch<BlogPost[]>('/blog-posts'),
  });
}

export function useAdminBlogPosts() {
  return useQuery({
    queryKey: ['adminBlogPosts'],
    queryFn: () => apiFetch<BlogPost[]>('/admin/blog-posts'),
  });
}

export function useCreateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<{ post: BlogPost }>('/admin/blog-posts', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminBlogPosts'] });
      qc.invalidateQueries({ queryKey: ['blogPosts'] });
    },
  });
}

export function useUpdateBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiFetch<{ post: BlogPost }>(`/admin/blog-posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminBlogPosts'] });
      qc.invalidateQueries({ queryKey: ['blogPosts'] });
    },
  });
}

export function useDeleteBlogPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/admin/blog-posts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminBlogPosts'] });
      qc.invalidateQueries({ queryKey: ['blogPosts'] });
    },
  });
}
