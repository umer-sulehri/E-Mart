import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { Product, User, Category } from '@/lib/types';

interface AdminProductsResponse {
  products: Product[];
  total: number;
}

interface AdminUsersResponse {
  users: User[];
  total: number;
}

interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
}

export function useAdminProducts(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['adminProducts', page],
    queryFn: () =>
      apiFetch<AdminProductsResponse>(
        `/admin/products?page=${page}&limit=${limit}`
      ),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch<Product>('/admin/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProducts'] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; body: Record<string, unknown> }) =>
      apiFetch<Product>(`/admin/products/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data.body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProducts'] }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/admin/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProducts'] }),
  });
}

export function useModerateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; status: 'active' | 'rejected' }) =>
      apiFetch<Product>(`/admin/products/${data.id}/moderation`, {
        method: 'PATCH',
        body: JSON.stringify({ status: data.status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useAdminUsers(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['adminUsers', page],
    queryFn: () =>
      apiFetch<AdminUsersResponse>(`/admin/users?page=${page}&limit=${limit}`),
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<User>(`/admin/users/${id}/block`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<User>(`/admin/users/${id}/unblock`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiFetch<{ user: User }>(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: () => apiFetch<AdminStats>('/admin/stats'),
  });
}

interface AdminAnalyticsMetrics {
  revenueTotal: number;
  revenueToday: number;
  revenueThisMonth: number;
  ordersTotal: number;
  ordersToday: number;
  ordersThisMonth: number;
  customersTotal: number;
  avgOrderValue: number;
  statusBreakdown: Record<string, number>;
  topProducts: { id: string; name: string; quantitySold: number; revenue: number }[];
  revenueSeries: { date: string; revenue: number; orders: number }[];
  lowStockProducts: { id: string; name: string; stock: number }[];
  ordersPerCustomer: number;
}

export function useAdminAnalytics(days = 30) {
  return useQuery({
    queryKey: ['adminAnalytics', days],
    queryFn: () => apiFetch<{ metrics: AdminAnalyticsMetrics; rangeDays: number }>(`/admin/analytics/dashboard?days=${days}`),
    select: (data) => data.metrics,
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ['adminCategories'],
    queryFn: () => apiFetch<{ categories: Category[] }>('/categories'),
    select: (data) => data.categories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string; icon: string; parentId?: string; image?: string }) =>
      apiFetch<{ category: Category }>('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminCategories'] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; body: Partial<Category> }) =>
      apiFetch<{ category: Category }>(`/admin/categories/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data.body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminCategories'] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/admin/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminCategories'] }),
  });
}
