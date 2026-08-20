import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { Review } from '@/lib/types';

interface ReviewsResponse {
  reviews: Review[];
}

export function useProductReviews(productSlug: string) {
  return useQuery({
    queryKey: ['reviews', productSlug],
    queryFn: () => apiFetch<ReviewsResponse>(`/products/${productSlug}/reviews`),
    select: (data) => data.reviews,
    enabled: !!productSlug,
  });
}

export function useCreateReview(productSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { rating: number; comment: string }) =>
      apiFetch<Review>(`/products/${productSlug}/reviews`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['reviews', productSlug] }),
  });
}
