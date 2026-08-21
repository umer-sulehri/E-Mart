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

interface SellerEarningsResponse {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingPayouts: number;
  recentSales: { date: string; amount: number }[];
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
