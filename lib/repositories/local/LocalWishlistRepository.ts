import { Product } from '@/lib/types';
import { WishlistRepository } from '../contracts/WishlistRepository';
import { mockProducts } from '@/lib/mock/products';

const wishlists = new Map<string, Set<string>>();

export class LocalWishlistRepository implements WishlistRepository {
  get(userId: string): string[] {
    return Array.from(wishlists.get(userId) ?? []);
  }

  getItems(userId: string): Product[] {
    const ids = wishlists.get(userId);
    if (!ids) return [];
    return mockProducts.filter((p) => ids.has(p.id));
  }

  add(userId: string, productId: string): void {
    if (!wishlists.has(userId)) {
      wishlists.set(userId, new Set());
    }
    wishlists.get(userId)!.add(productId);
  }

  remove(userId: string, productId: string): void {
    const ids = wishlists.get(userId);
    if (ids) {
      ids.delete(productId);
    }
  }

  hasItem(userId: string, productId: string): boolean {
    return wishlists.get(userId)?.has(productId) ?? false;
  }
}
