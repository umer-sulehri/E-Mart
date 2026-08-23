import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/lib/types';

interface CartStore {
  items: CartItem[];
  couponCode: string | null;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setCoupon: (code: string | null) => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.productId === product.id);
        const maxQty = product.stock;
        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, maxQty);
          set({
            items: items.map((i) =>
              i.productId === product.id
                ? { ...i, quantity: newQty }
                : i
            ),
          });
        } else {
          const newQty = Math.min(quantity, maxQty);
          if (newQty <= 0) return;
          set({
            items: [...items, { id: `cart-${product.id}-${Date.now()}`, productId: product.id, product, quantity: newQty }],
          });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.min(quantity, i.product.stock) } : i
          ),
        });
      },
      clearCart: () => set({ items: [], couponCode: null }),
      setCoupon: (code) => set({ couponCode: code }),
      total: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'emart-cart', skipHydration: true }
  )
);
