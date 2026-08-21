import { Product } from '@/lib/types';

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
  sort?: string;
  sellerId?: string;
}

export interface ProductRepository {
  findAll(filters?: ProductFilters, page?: number, limit?: number): { products: Product[]; total: number } | Promise<{ products: Product[]; total: number }>;
  findBySlug(slug: string): Product | null | Promise<Product | null>;
  findById(id: string): Product | null | Promise<Product | null>;
  create(data: Omit<Product, 'id' | 'createdAt' | 'rating' | 'reviewCount'>): Product | Promise<Product>;
  createBulk(products: Omit<Product, 'id' | 'createdAt' | 'rating' | 'reviewCount'>[]): Product[] | Promise<Product[]>;
  update(id: string, data: Partial<Product>): Product | null | Promise<Product | null>;
  delete(id: string): boolean | Promise<boolean>;
  search(query: string): Product[] | Promise<Product[]>;
}
