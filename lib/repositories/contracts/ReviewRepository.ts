import { Review } from '@/lib/types';

export interface ReviewRepository {
  findByProduct(productId: string): Review[] | Promise<Review[]>;
  findByUser(userId: string): Review[] | Promise<Review[]>;
  findBySellerProducts(productIds: string[]): Review[] | Promise<Review[]>;
  create(data: Omit<Review, 'id' | 'createdAt'>): Review | Promise<Review>;
  delete(id: string): void | Promise<void>;
}
