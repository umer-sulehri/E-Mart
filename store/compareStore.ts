import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompareItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  category?: string;
  brand?: string;
  inStock: boolean;
}

interface CompareState {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (productId: string) => void;
  clearAll: () => void;
  hasItem: (productId: string) => boolean;
  itemCount: () => number;
}

const MAX_COMPARE_ITEMS = 4;

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          if (state.items.length >= MAX_COMPARE_ITEMS) return state;
          if (state.items.find((i) => i.id === item.id)) return state;
          return { items: [...state.items, item] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== productId),
        })),

      clearAll: () => set({ items: [] }),

      hasItem: (productId) => get().items.some((i) => i.id === productId),

      itemCount: () => get().items.length,
    }),
    {
      name: 'emart-compare',
    }
  )
);
