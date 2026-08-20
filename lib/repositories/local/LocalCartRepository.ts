import { CartItem, Product } from '@/lib/types';
import { CartRepository } from '../contracts/CartRepository';
import { mockProducts } from '@/lib/mock/products';

const carts = new Map<string, CartItem[]>();

function findProduct(productId: string): Product | undefined {
  return mockProducts.find((p) => p.id === productId);
}

export class LocalCartRepository implements CartRepository {
  getItems(userId: string): CartItem[] {
    return carts.get(userId) ?? [];
  }

  addItem(userId: string, productId: string, quantity: number): CartItem {
    const product = findProduct(productId);
    if (!product) throw new Error('Product not found');

    const items = carts.get(userId) ?? [];
    const existing = items.find((item) => item.productId === productId);

    if (existing) {
      existing.quantity += quantity;
      carts.set(userId, items);
      return existing;
    }

    const newItem: CartItem = {
      id: crypto.randomUUID(),
      productId,
      product,
      quantity,
    };
    items.push(newItem);
    carts.set(userId, items);
    return newItem;
  }

  updateQuantity(userId: string, productId: string, quantity: number): CartItem | null {
    const items = carts.get(userId) ?? [];
    const item = items.find((i) => i.productId === productId);
    if (!item) return null;

    item.quantity = quantity;
    carts.set(userId, items);
    return item;
  }

  removeItem(userId: string, productId: string): boolean {
    const items = carts.get(userId) ?? [];
    const filtered = items.filter((i) => i.productId !== productId);
    if (filtered.length === items.length) return false;
    carts.set(userId, filtered);
    return true;
  }

  clear(userId: string): void {
    carts.delete(userId);
  }
}
