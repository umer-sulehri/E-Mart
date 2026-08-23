import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { Product, Order } from '@/lib/types';

interface SellerProductsResponse {
  products: Product[];
  total: number;
}

interface SellerOrdersResponse {
  orders: Order[];
  total: number;
}

export interface SellerEarningsProduct {
  name: string;
  earnings: number;
  quantity: number;
}

export interface SellerEarningsResponse {
  totalEarnings: number;
  deliveredEarnings: number;
  totalItemsSold: number;
  totalOrders: number;
  deliveredOrders: number;
  products: SellerEarningsProduct[];
  monthly?: { month: string; amount: number }[];
}

export interface SellerPayout {
  id: string;
  amount: number;
  method: 'bank_transfer' | 'stripe_connect' | 'jazzcash';
  status: 'requested' | 'processing' | 'paid' | 'rejected';
  reference?: string;
  note?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface SellerPayoutSummary {
  grossEarnings: number;
  commission: number;
  netEarnings: number;
  withdrawn: number;
  pendingWithdrawal: number;
  availableForPayout: number;
}

export interface SellerReviewItem {
  id: string;
  productId: string;
  productName?: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type SellerOrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface SellerProductInput {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  categoryId: string;
  images: string[];
  tags?: string[];
  isFeatured?: boolean;
  isNew?: boolean;
}

interface SellerProfileResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export function useSellerProducts(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['sellerProducts', page],
    queryFn: () =>
      apiFetch<SellerProductsResponse>(`/seller/products?page=${page}&limit=${limit}`),
  });
}

export function useSellerOrders(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['sellerOrders', page],
    queryFn: () =>
      apiFetch<SellerOrdersResponse>(`/seller/orders?page=${page}&limit=${limit}`),
  });
}

export function useSellerEarnings() {
  return useQuery({
    queryKey: ['sellerEarnings'],
    queryFn: () => apiFetch<SellerEarningsResponse>('/seller/earnings'),
  });
}

export function useSellerPayouts() {
  return useQuery({
    queryKey: ['sellerPayouts'],
    queryFn: () =>
      apiFetch<{ summary: SellerPayoutSummary; payouts: SellerPayout[] }>('/seller/payout'),
  });
}

export function useSellerReviews(limit = 50) {
  return useQuery({
    queryKey: ['sellerReviews', limit],
    queryFn: () => apiFetch<{ reviews: SellerReviewItem[] }>(`/seller/reviews?limit=${limit}`),
  });
}

export function useCreateSellerProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SellerProductInput) =>
      apiFetch<{ product: Product }>('/seller/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellerProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateSellerProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<SellerProductInput> }) =>
      apiFetch<{ product: Product }>(`/seller/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sellerProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      }
    },
  });
}

export function useDeleteSellerProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/seller/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellerProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateSellerOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SellerOrderStatus }) =>
      apiFetch<{ order: Order }>(`/seller/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellerOrders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useSellerProfile() {
  return useQuery({
    queryKey: ['sellerProfile'],
    queryFn: () => apiFetch<SellerProfileResponse>('/seller/profile'),
  });
}

export function useUpdateSellerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; phone?: string; avatar?: string }) =>
      apiFetch<SellerProfileResponse>('/seller/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sellerProfile'] }),
  });
}
