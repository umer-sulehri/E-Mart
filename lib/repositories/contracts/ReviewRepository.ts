import { Review } from '@/lib/types';

export interface ReviewRepository {
  findByProduct(productId: string): Review[] | Promise<Review[]>;
  findByUser(userId: string): Review[] | Promise<Review[]>;
  findBySellerProducts(productIds: string[]): Review[] | Promise<Review[]>;
  findRecent(limit?: number): (Review & { productName?: string; productSlug?: string })[] | Promise<(Review & { productName?: string; productSlug?: string })[]>;
  findById(id: string): Review | null | Promise<Review | null>;
  /** Attach (or replace) the selling store's public reply to a review. */
  addSellerReply(id: string, reply: string): Review | null | Promise<Review | null>;
  create(data: Omit<Review, 'id' | 'createdAt'>): Review | Promise<Review>;
  update(id: string, userId: string, data: { rating?: number; comment?: string }): Review | null | Promise<Review | null>;
  delete(id: string): void | Promise<void>;
}
