import { Review } from '@/lib/types';
import { ReviewRepository } from '../contracts/ReviewRepository';
import { mockReviews } from '@/lib/mock/orders';

const reviews: Review[] = [...mockReviews];

export class LocalReviewRepository implements ReviewRepository {
  findByProduct(productId: string): Review[] {
    return reviews.filter((r) => r.productId === productId);
  }

  findByUser(userId: string): Review[] {
    return reviews.filter((r) => r.userId === userId);
  }

  findBySellerProducts(productIds: string[]): Review[] {
    return reviews.filter((r) => productIds.includes(r.productId));
  }

  findRecent(limit: number = 20): (Review & { productName?: string; productSlug?: string })[] {
    return [...reviews]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  create(data: Omit<Review, 'id' | 'createdAt'>): Review {
    const review: Review = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    reviews.push(review);
    return review;
  }

  update(id: string, userId: string, data: { rating?: number; comment?: string }): Review | null {
    const index = reviews.findIndex((r) => r.id === id && r.userId === userId);
    if (index === -1) return null;
    reviews[index] = { ...reviews[index], ...data };
    return reviews[index];
  }

  delete(id: string): void {
    const index = reviews.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Review not found');
    reviews.splice(index, 1);
  }
}
