import { CartItem } from '@/lib/types';

export interface CartRepository {
  getItems(userId: string): CartItem[] | Promise<CartItem[]>;
  addItem(userId: string, productId: string, quantity: number): CartItem | Promise<CartItem>;
  updateQuantity(userId: string, productId: string, quantity: number): CartItem | null | Promise<CartItem | null>;
  removeItem(userId: string, productId: string): boolean | Promise<boolean>;
  clear(userId: string): void | Promise<void>;
}
