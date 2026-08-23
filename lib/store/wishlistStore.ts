import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncWishlistAdd, syncWishlistRemove } from './wishlistSync';

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string) => void;
  hasItem: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (productId) =>
        set((state) => {
          if (state.items.some((i) => i.productId === productId)) return state;
          syncWishlistAdd(productId);
          return { items: [...state.items, { productId, addedAt: new Date().toISOString() }] };
        }),

      removeItem: (productId) => {
        syncWishlistRemove(productId);
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      toggleItem: (productId) => {
        const { items } = get();
        if (items.some((i) => i.productId === productId)) {
          get().removeItem(productId);
        } else {
          get().addItem(productId);
        }
      },

      hasItem: (productId) => get().items.some((i) => i.productId === productId),

      clear: () => set({ items: [] }),
    }),
    { name: 'emart-wishlist' },
  ),
);
