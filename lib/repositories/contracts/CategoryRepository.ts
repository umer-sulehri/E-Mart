import { Category } from '@/lib/types';

export interface CategoryRepository {
  findAll(): Category[] | Promise<Category[]>;
  findById(id: string): Category | null | Promise<Category | null>;
  findBySlug(slug: string): Category | null | Promise<Category | null>;
  findChildren(parentId: string): Category[] | Promise<Category[]>;
  create(data: Omit<Category, 'id'>): Category | Promise<Category>;
  update(id: string, data: Partial<Category>): Category | null | Promise<Category | null>;
  delete(id: string): boolean | Promise<boolean>;
}
