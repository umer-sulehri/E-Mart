import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { Product, ProductFilters } from '@/lib/types';

export function useProducts(
  filters?: ProductFilters,
  page = 1,
  limit = 20,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['products', filters ?? null, page, limit],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.category) params.set('category', filters.category);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.sort) params.set('sort', filters.sort);
      if (filters?.minPrice) params.set('minPrice', String(filters.minPrice));
      if (filters?.maxPrice) params.set('maxPrice', String(filters.maxPrice));
      if (filters?.ids?.length) params.set('ids', filters.ids.join(','));
      params.set('page', String(page));
      params.set('limit', String(limit));
      return apiFetch<{ products: Product[]; total: number }>(`/products?${params}`);
    },
    enabled: options?.enabled ?? true,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const res = await apiFetch<{ product: Product }>(`/products/${slug}`);
      return res.product;
    },
    enabled: !!slug,
  });
}
