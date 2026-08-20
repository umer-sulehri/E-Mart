import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { Category } from '@/lib/types';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch<{ categories: Category[] }>('/categories'),
    select: (data) => data.categories,
  });
}

export function useCategoryChildren(parentId: string) {
  return useQuery({
    queryKey: ['categoryChildren', parentId],
    queryFn: () =>
      apiFetch<{ children: Category[] }>(`/categories/${parentId}/children`),
    select: (data) => data.children,
    enabled: !!parentId,
  });
}
