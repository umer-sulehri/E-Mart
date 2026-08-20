import { Review } from '@/lib/types';
import { ReviewRepository } from '../contracts/ReviewRepository';
import { mockReviews } from '@/lib/mock/orders';

const reviews: Review[] = [...mockReviews];

export class LocalReviewRepository implements ReviewRepository {
  findByProduct(productId: string): Review[] {
    return reviews.filter((r) => r.productId === productId);
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

  delete(id: string): void {
    const index = reviews.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Review not found');
    reviews.splice(index, 1);
  }
}
