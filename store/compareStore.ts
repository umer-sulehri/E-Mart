import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  MAX_COMPARE_ITEMS,
  canAddToCompare,
  remainingCompareSlots,
  type AddItemDecision,
} from '@/lib/compare-rules';

export { MAX_COMPARE_ITEMS, remainingCompareSlots };
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
  /** Display name of the category, used for the compare-page banner. */
  category?: string;
  /**
   * Stable category identity, used to enforce the same-category rule.
   *
   * Distinct from `category` (a human-readable name) and deliberately not
   * optional: a comparison can only be validated if every item knows which
   * category it belongs to.
   */
  categoryId: string;
  brand?: string;
  inStock: boolean;
}

interface CompareState {
  items: CompareItem[];
  /** Add a product, or explain why it was refused. */
  addItem: (item: CompareItem) => AddItemDecision;
  removeItem: (productId: string) => void;
  clearAll: () => void;
  hasItem: (productId: string) => boolean;
  itemCount: () => number;
  /**
   * Drop any item that predates `categoryId`. Such items cannot be
   * category-validated, so keeping them would let a cross-category comparison
   * through the moment a stale entry is present.
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

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== productId),
        })),

      clearAll: () => set({ items: [] }),

      hasItem: (productId) => get().items.some((i) => i.id === productId),

      itemCount: () => get().items.length,

      reconcileItems: () =>
        set((state) => {
          const valid = state.items.filter(
            (item) => typeof item.categoryId === 'string' && item.categoryId.length > 0
          );
          return valid.length === state.items.length ? state : { items: valid };
        }),
    }),
    {
      name: 'emart-compare',
      storage: createJSONStorage(() => sessionStorage),
      // Session storage, so no migration across storage media is possible. This
      // handles the one case that still occurs: a session that predates
      // `categoryId` being added to the schema.
      version: 2,
      migrate: () => ({ items: [] }),
      onRehydrateStorage: () => (state) => {
        state?.reconcileItems();

        // Comparison state used to live in localStorage. Changing the storage
        // medium leaves that key behind permanently, so remove it — it is a
        // stale copy of the user's browsing intent that we no longer read, and
        // the cookie policy no longer claims we store it.
        try {
          window.localStorage.removeItem('emart-compare');
        } catch {
          // Private browsing / storage disabled — nothing to clean up.
        }
      },
    }
  )
);
