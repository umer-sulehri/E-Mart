import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discount: number;

  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;

  subtotal: () => number;
  taxAmount: () => number;
  shippingCost: () => number;
  discountAmount: () => number;
  total: () => number;
  itemCount: () => number;
}

const FREE_SHIPPING_THRESHOLD = 5000;
const SHIPPING_COST = 200;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discount: 0,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? {
                      ...i,
                      quantity: i.quantity + item.quantity,
                      totalPrice:
                        (i.quantity + item.quantity) * i.unitPrice,
                    }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId
                    ? { ...i, quantity, totalPrice: quantity * i.unitPrice }
                    : i
                ),
        })),

      clearCart: () => set({ items: [], couponCode: null, discount: 0 }),

      applyCoupon: (code, discount) =>
        set({ couponCode: code, discount }),

      removeCoupon: () => set({ couponCode: null, discount: 0 }),

      subtotal: () =>
        get().items.reduce((sum, item) => sum + item.totalPrice, 0),

      taxAmount: () => 0,

      shippingCost: () => {
        const subtotal = get().subtotal();
        return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
      },

      discountAmount: () => {
        const state = get();
        const sub = state.subtotal();
        return Math.min(state.discount, sub);
      },

      total: () => {
        const state = get();
        return (
          state.subtotal() +
          state.taxAmount() +
          state.shippingCost() -
          state.discountAmount()
        );
      },

      itemCount: () =>
        get().items.reduce((count, item) => count + item.quantity, 0),
    }),
    {
      name: 'emart-cart',
    }
  )
);
