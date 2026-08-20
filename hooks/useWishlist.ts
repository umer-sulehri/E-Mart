import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { Product } from '@/lib/types';

interface WishlistResponse {
  items: Product[];
}

export function useWishlist() {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: () => apiFetch<WishlistResponse>('/wishlist'),
    select: (data) => data.items,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      apiFetch<{ success: boolean }>('/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      apiFetch<{ success: boolean }>(`/wishlist/${productId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });
}
