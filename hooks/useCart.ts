import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { CartItem } from '@/lib/types';

interface CartResponse {
  items: CartItem[];
  total: number;
}

export function useCartQuery() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => apiFetch<CartResponse>('/cart/items'),
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { productId: string; quantity: number }) =>
      apiFetch<CartItem>('/cart/items', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useUpdateCartQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; quantity: number }) =>
      apiFetch<CartItem>(`/cart/items/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: data.quantity }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/cart/items/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });
}
