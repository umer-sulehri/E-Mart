import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { Order } from '@/lib/types';

interface OrdersResponse {
  orders: Order[];
  total: number;
}

interface TrackingResponse {
  status: string;
  history: { status: string; date: string }[];
}

export function useOrders(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['orders', page],
    queryFn: () =>
      apiFetch<OrdersResponse>(`/orders?page=${page}&limit=${limit}`),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { address: string; paymentMethod: string }) =>
      apiFetch<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useOrderTracking(id: string) {
  return useQuery({
    queryKey: ['orderTracking', id],
    queryFn: () => apiFetch<TrackingResponse>(`/orders/${id}/track`),
    enabled: !!id,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Order>(`/orders/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useAdminOrders(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['adminOrders', page],
    queryFn: () =>
      apiFetch<OrdersResponse>(`/admin/orders?page=${page}&limit=${limit}`),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; status: string }) =>
      apiFetch<Order>(`/admin/orders/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: data.status }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminOrders'] }),
  });
}
