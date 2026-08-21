import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { Review } from '@/lib/types';

interface ReviewsResponse {
  reviews: Review[];
}

export interface ReviewWithProduct extends Review {
  productName: string;
  productImage: string;
  productSlug: string;
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

export function useUserReviews() {
  return useQuery({
    queryKey: ['userReviews'],
    queryFn: () => apiFetch<{ reviews: ReviewWithProduct[] }>('/auth/reviews'),
    select: (data) => data.reviews,
  });
}

export function useSellerReviews() {
  return useQuery({
    queryKey: ['sellerReviews'],
    queryFn: () => apiFetch<{ reviews: ReviewWithProduct[] }>('/seller/reviews'),
    select: (data) => data.reviews,
  });
}
