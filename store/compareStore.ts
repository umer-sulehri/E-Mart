import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  MAX_COMPARE_ITEMS,
  canAddToCompare,
  lockedCategoryId,
  reconcileCompareItems,
  remainingCompareSlots,
  type AddItemDecision,
} from '@/lib/compare-rules';
import { COMPARE_STORAGE_KEY } from '@/lib/storage-keys';

export { MAX_COMPARE_ITEMS, lockedCategoryId, remainingCompareSlots };
export type { AddItemDecision };

export interface CompareItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  /** Display name of the category, shown in the comparison table. */
  category?: string;
  /**
   * Stable category identity. The tray is locked to this, so it is deliberately
   * not optional: a product that cannot name its category could not be compared
   * with anything reliably.
   */
  categoryId: string;
  brand?: string;
  inStock: boolean;
}

interface CompareState {
  items: CompareItem[];
  /** Save a product, or explain why it was refused. */
  addItem: (item: CompareItem) => AddItemDecision;
  /**
   * Discard the current tray and start a new comparison with `item`.
   *
   * This is the action behind the "Clear & add this instead" affordance shown
   * when a product from another category is refused. It deliberately bypasses
   * the category check — the point is to replace the tray, not to join it — but
   * still refuses a duplicate, and still caps the result, so it cannot be used
   * to smuggle a mixed list back in.
   */
  replaceWith: (item: CompareItem) => void;
  removeItem: (productId: string) => void;
  clearAll: () => void;
  hasItem: (productId: string) => boolean;
  itemCount: () => number;
  /**
   * Bring a rehydrated tray back within the current rules: drop duplicates,
   * keep only the first category, and enforce the cap. Session storage can
   * outlive a deployment, so its contents cannot be assumed to match the shape
   * written below.
   */
  reconcileItems: () => void;
}

/**
 * Comparison state is session-scoped, not persisted across browser restarts:
 * a stale comparison from a previous session is confusing and leaks browsing
 * intent. Deep links (`/compare?products=a,b`) still work, because
 * `ComparePageClient` rehydrates missing items from the URL.
 */
export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const decision = canAddToCompare(get().items, item);
        if (decision.allowed) {
          set((state) => ({ items: [...state.items, item] }));
        }
        return decision;
      },

      replaceWith: (item) =>
        set((state) => {
          // An item already saved needs no swap: keeping the existing tray means
          // an "add" that was already a no-op cannot throw away a comparison the
          // user built up.
          if (state.items.some((i) => i.id === item.id)) return state;
          return { items: [item] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== productId),
        })),

      clearAll: () => set({ items: [] }),

      hasItem: (productId) => get().items.some((i) => i.id === productId),

      itemCount: () => get().items.length,

      reconcileItems: () =>
        set((state) => {
          const items = reconcileCompareItems(state.items);
          if (items.length === state.items.length) return state;
          return { items };
        }),
    }),
    {
      name: COMPARE_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      // Session storage, so there is no migration across storage media to
      // perform. This handles the two cases that still occur: a tray written
      // before the tray held more than one category, and a tray written before
      // the group switcher existed. In both cases the saved products are still
      // valid, so they are kept and pruned by `reconcileItems` rather than
      // dropped wholesale.
      version: 4,
      migrate: (persisted) => {
        const state = persisted as { items?: CompareItem[] } | undefined;
        return { items: state?.items ?? [] };
      },
      onRehydrateStorage: () => (state) => {
        // A tray saved under the multi-category rules can hold products from
        // several categories, which would render a meaningless table. Pruning
        // here is what repairs a session that is already open in a tab.
        state?.reconcileItems();

        // Comparison state used to live in localStorage. Changing the storage
        // medium leaves that key behind permanently, so remove it — it is a
        // stale copy of the user's browsing intent that we no longer read, and
        // the cookie policy no longer claims we store it.
        try {
          window.localStorage.removeItem(COMPARE_STORAGE_KEY);
        } catch {
          // Private browsing / storage disabled — nothing to clean up.
        }
      },
    }
  )
);
