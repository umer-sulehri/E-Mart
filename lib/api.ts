import { resolveImage } from '@/lib/imageLoader';

const API_BASE = '/api/v1';

export async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  products: {
    list: (params?: Record<string, string>) =>
      fetchAPI(`/products?${new URLSearchParams(params || {})}`),
    getBySlug: (slug: string) =>
      fetchAPI(`/products/${slug}`),
    getReviews: (slug: string, params?: Record<string, string>) =>
      fetchAPI(`/products/${slug}/reviews?${new URLSearchParams(params || {})}`),
  },
  categories: {
    list: () => fetchAPI('/categories'),
  },
  search: {
    suggestions: (q: string) =>
      fetchAPI(`/search/suggestions?q=${encodeURIComponent(q)}`),
    trending: () => fetchAPI('/search/trending'),
    history: () => fetchAPI('/search/history'),
    saveHistory: (query: string) =>
      fetchAPI('/search/history', {
        method: 'POST',
        body: JSON.stringify({ query }),
      }),
  },
  banners: {
    list: () => fetchAPI('/banners'),
  },
  blog: {
    list: (params?: Record<string, string>) =>
      fetchAPI(`/blog-posts?${new URLSearchParams(params || {})}`),
  },
  socialLinks: {
    list: () => fetchAPI('/social-links'),
  },
};

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  discount_price?: number;
  images: string[];
  rating: number;
  review_count: number;
  categories?: { name: string; slug: string };
  category?: { name: string; slug: string };
  vendors?: { name: string; slug: string };
  vendor?: { name: string; slug: string };
  brands?: { name: string; slug: string };
  brand?: { name: string; slug: string };
  is_active?: boolean;
  is_featured?: boolean;
  is_new?: boolean;
  description?: string;
  short_description?: string;
  stock_quantity?: number;
  sku?: string;
  specifications?: Record<string, string>;
  tags?: string[];
  weight?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  display_order: number;
  subcategories?: ApiCategory[];
}

export interface ApiMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  meta?: ApiMeta;
}

export interface ApiSingleResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiBanner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  position: string;
  priority: number;
}

export interface ApiBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  cover_image?: string;
  category?: string;
  author?: string;
  published_at?: string;
  created_at: string;
  view_count?: number;
}

export interface ApiSocialLink {
  id: string;
  platform: string;
  url: string;
  icon?: string;
  is_active: boolean;
  display_order: number;
}

export function apiProductToCardProduct(p: ApiProduct) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    discountPrice: p.discount_price,
    rating: p.rating,
    reviewCount: p.review_count,
    image: resolveImage(p.images?.[0]),
  };
}

export function apiCategoryToCarouselCategory(c: ApiCategory) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: resolveImage(c.image_url),
  };
}
