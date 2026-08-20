import { Product } from '@/lib/types';

export interface WishlistRepository {
  get(userId: string): string[] | Promise<string[]>;
  getItems(userId: string): Product[] | Promise<Product[]>;
  add(userId: string, productId: string): void | Promise<void>;
  remove(userId: string, productId: string): void | Promise<void>;
  hasItem(userId: string, productId: string): boolean | Promise<boolean>;
}
