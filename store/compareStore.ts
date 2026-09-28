import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  MAX_COMPARE_ITEMS,
  MAX_SAVED_COMPARE_ITEMS,
  canAddToCompare,
  remainingCompareSlots,
  remainingTraySlots,
  resolveGroupLabel,
  type AddItemDecision,
} from '@/lib/compare-rules';
import { COMPARE_STORAGE_KEY } from '@/lib/storage-keys';

export {
  MAX_COMPARE_ITEMS,
  MAX_SAVED_COMPARE_ITEMS,
  remainingCompareSlots,
  remainingTraySlots,
};
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
  /** Display name of the category, used to label the group in the rail. */
  category?: string;
  /**
   * Stable category identity. This is the field the tray is partitioned by, so
   * it is deliberately not optional: an item that cannot name its category
   * could not be grouped, and grouping is what keeps a comparison meaningful.
   */
  categoryId: string;
  brand?: string;
  inStock: boolean;
}

interface CompareState {
  items: CompareItem[];
  /**
   * Category whose group is rendered in the comparison table. `null` means
   * "whatever the first group is", which is the state a fresh tray and a
   * rehydrated tray both start in.
   */
  activeCategoryId: string | null;
  /** Save a product, or explain why it was refused. */
  addItem: (item: CompareItem) => AddItemDecision;
  removeItem: (productId: string) => void;
  clearAll: () => void;
  hasItem: (productId: string) => boolean;
  itemCount: () => number;
  /** Choose which category group the table renders. */
  setActiveCategory: (categoryId: string) => void;
  /**
   * Bring a rehydrated tray back within the current rules: drop duplicates,
   * enforce both caps, and clear an active group that no longer has any
   * products. Session storage can outlive a deployment, so its contents cannot
   * be assumed to match the shape written below.
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
      activeCategoryId: null,

      addItem: (item) => {
        const decision = canAddToCompare(get().items, item);
        if (decision.allowed) {
          set((state) => ({ items: [...state.items, item] }));
        }
        return decision;
      },

      removeItem: (productId) =>
        set((state) => {
          const items = state.items.filter((i) => i.id !== productId);
          // Removing the last product of the active group would leave the table
          // rendering a group that is no longer there, so fall back to whatever
          // is left rather than rendering an empty table.
          const activeCategoryId = items.some(
            (i) => i.categoryId === state.activeCategoryId
          )
            ? state.activeCategoryId
            : null;
          return { items, activeCategoryId };
        }),

      clearAll: () => set({ items: [], activeCategoryId: null }),

      hasItem: (productId) => get().items.some((i) => i.id === productId),

      itemCount: () => get().items.length,

      setActiveCategory: (categoryId) => set({ activeCategoryId: categoryId }),

      reconcileItems: () =>
        set((state) => {
          const seen = new Set<string>();
          const deduped = state.items.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });

          // Enforce the per-category cap first, then the tray cap, both in
          // first-added order so the surviving items are the ones the user
          // reached for earliest.
          const perCategory = new Map<string, number>();
          const withinCaps: CompareItem[] = [];
          for (const item of deduped) {
            const used = perCategory.get(item.categoryId) ?? 0;
            if (used >= MAX_COMPARE_ITEMS) continue;
            if (withinCaps.length >= MAX_SAVED_COMPARE_ITEMS) break;
            perCategory.set(item.categoryId, used + 1);
            withinCaps.push(item);
          }

          const activeCategoryId = withinCaps.some(
            (i) => i.categoryId === state.activeCategoryId
          )
            ? state.activeCategoryId
            : null;

          const unchanged =
            withinCaps.length === state.items.length && activeCategoryId === state.activeCategoryId;
          if (unchanged) return state;

          return { items: withinCaps, activeCategoryId };
        }),
    }),
    {
      name: COMPARE_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      // Session storage, so there is no migration across storage media to
      // perform. This handles the case that still occurs: a tab opened before
      // the tray learned to hold more than one category. The saved products are
      // kept — they are still valid — and only the active-group pointer, which
      // is new, is left unset.
      version: 3,
      migrate: (persisted) => {
        const state = persisted as { items?: CompareItem[] } | undefined;
        return { items: state?.items ?? [], activeCategoryId: null };
      },
      onRehydrateStorage: () => (state) => {
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

/** Label for a tray item's category, for toasts and the switcher rail. */
export function compareItemGroupLabel(item: CompareItem): string {
  return resolveGroupLabel(item);
}
