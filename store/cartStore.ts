import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  discount: number;
  freeShipping: boolean;
  isLoading: boolean;

  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number, freeShipping?: boolean) => void;
  removeCoupon: () => void;

  syncWithServer: () => Promise<void>;
  addToServer: (productId: string, quantity: number) => Promise<void>;
  removeFromServer: (cartItemId: string) => Promise<void>;
  updateOnServer: (cartItemId: string, quantity: number) => Promise<void>;

  subtotal: () => number;
  taxAmount: () => number;
  shippingCost: () => number;
  discountAmount: () => number;
  total: () => number;
  itemCount: () => number;
}

const FREE_SHIPPING_THRESHOLD = 2000;
const SHIPPING_COST = 150;
const TAX_RATE = 0.05;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discount: 0,
      freeShipping: false,
      isLoading: false,

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

      removeItem: (productId) => {
        const item = get().items.find((i) => i.productId === productId);
        if (item) {
          get().removeFromServer(item.id);
        }
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        const item = get().items.find((i) => i.productId === productId);
        if (item) {
          if (quantity <= 0) {
            get().removeFromServer(item.id);
          } else if (item.id.startsWith('cart-')) {
            get().addToServer(productId, quantity);
          } else {
            get().updateOnServer(item.id, quantity);
          }
        }
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId
                    ? { ...i, quantity, totalPrice: quantity * i.unitPrice }
                    : i
                ),
        }));
      },

      clearCart: () => set({ items: [], couponCode: null, discount: 0, freeShipping: false }),

      applyCoupon: (code, discount, freeShipping = false) =>
        set({ couponCode: code, discount, freeShipping }),

      removeCoupon: () => set({ couponCode: null, discount: 0, freeShipping: false }),

      syncWithServer: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/v1/cart/items');
          if (!res.ok) throw new Error('Failed to fetch cart');
          const data = await res.json();
          if (data.success && data.data?.items) {
            const serverItems: CartItem[] = data.data.items.map((item: any) => {
              const p = item.product || {};
              const unitPrice = p.discount_price ?? p.price ?? 0;
              const product = {
                id: p.id || item.productId,
                name: p.name || 'Product',
                slug: p.slug || '',
                description: p.description || '',
                price: p.price ?? 0,
                discountPrice: p.discount_price,
                stockQuantity: p.stock_quantity ?? 0,
                sku: p.sku || '',
                category: { id: '', name: '', slug: '' },
                categoryId: '',
                rating: p.rating ?? 0,
                reviewCount: p.review_count ?? 0,
                isActive: p.is_active ?? true,
                isFeatured: false,
                isNew: false,
                images: Array.isArray(p.images) ? p.images : [],
                createdAt: p.created_at || '',
                updatedAt: p.updated_at || '',
              };
              return {
                id: item.id,
                productId: item.productId,
                product,
                quantity: item.quantity,
                unitPrice,
                totalPrice: unitPrice * item.quantity,
                addedAt: item.addedAt || new Date().toISOString(),
              };
            });
            set({ items: serverItems });
          }
        } catch {
          // Keep local cart on failure
        } finally {
          set({ isLoading: false });
        }
      },

      addToServer: async (productId, quantity) => {
        try {
          const res = await fetch('/api/v1/cart/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity }),
          });
          if (res.ok) {
            await get().syncWithServer();
          }
        } catch {
          // Silently fail - local cart already updated
        }
      },

      removeFromServer: async (cartItemId) => {
        try {
          await fetch(`/api/v1/cart/items/${cartItemId}`, {
            method: 'DELETE',
          });
        } catch {
          // Silently fail
        }
      },

      updateOnServer: async (cartItemId, quantity) => {
        try {
          await fetch(`/api/v1/cart/items/${cartItemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity }),
          });
        } catch {
          // Silently fail
        }
      },

      subtotal: () =>
        get().items.reduce((sum, item) => sum + item.totalPrice, 0),

      taxAmount: () => Math.round(get().subtotal() * TAX_RATE),

      shippingCost: () => {
        const state = get();
        if (state.freeShipping) return 0;
        const subtotal = state.subtotal();
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
