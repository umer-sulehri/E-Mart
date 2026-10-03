import { create } from 'zustand';
import type { WishlistPreviewItem } from '@/types';
import { WISHLIST_DRAWER_LIMIT } from '@/lib/constants';

/**
 * The wishlist, held client-side so the header badge, the side drawer and every
 * product card's heart can read the same answer.
 *
 * Before this, each card ran its own `GET /api/v1/wishlist?productId=` probe on
 * mount, so a 24-card grid fired 24 requests and the count was unknowable
 * without fetching the whole list. `hydrate()` replaces that with one summary
 * request; `ids` then answers "is this saved?" in O(1) with a stable reference,
 * which is why it is a record rather than an array or a `Set` — a `Set` mutated
 * in place would never notify a selector, and an `ids.includes()` test in a
 * render path re-runs on every unrelated store write.
 *
 * Not persisted: the server is the source of truth, and a stale local copy would
 * resurrect items the shopper deleted on another device.
 */
export type WishlistStatus = 'idle' | 'loading' | 'ready';

interface WishlistState {
  /** product_id -> true. A record keeps `!!ids[id]` O(1) and referentially stable. */
  ids: Record<string, true>;
  /** Saved products, newest first. Trimmed to {@link WISHLIST_DRAWER_LIMIT}. */
  items: WishlistPreviewItem[];
  /** Server total, which may exceed `items.length` — the drawer is a preview. */
  count: number;
  status: WishlistStatus;
  isOpen: boolean;
  /**
   * Bumped on every add/remove. The wishlist pages watch it in an effect
   * dependency so a row removed in the drawer disappears from the full page
   * without either side owning the other's list.
   */
  revision: number;

  hydrate: () => Promise<void>;
  /** Optimistically record a save. Used before the POST resolves. */
  markSaved: (productId: string) => void;
  /** Optimistically record a removal. Used before the DELETE resolves. */
  markRemoved: (productId: string) => void;
  /** Add the full row once the server has echoed it back. */
  addItem: (item: WishlistPreviewItem) => void;
  /**
   * Replace the preview list with what the list endpoint just returned.
   *
   * The drawer used to hold these rows in its own `useState`, which meant a
   * removal went to the store (badge drops) while the row it was removing from
   * was a different list entirely — so the card stayed on screen until the
   * drawer was closed and reopened. Writing through the store gives the drawer
   * and `removeItem` one list, and keeps the preview capped and newest-first.
   */
  setItems: (items: WishlistPreviewItem[]) => void;
  /** Drop the full row when it is removed from the drawer. */
  removeItem: (productId: string) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  reset: () => void;
}

const EMPTY_IDS: Record<string, true> = {};

/**
 * Flattens a `/api/v1/wishlist` row into {@link WishlistPreviewItem}.
 *
 * Exported so the drawer, the public wishlist page and the dashboard one build
 * rows identically. A product that has since been deleted or deactivated joins
 * back as `null` and is dropped, which is why `products` is nullable here.
 */
export function toWishlistItem(row: {
  id: string;
  product_id: string;
  created_at: string;
  products: {
    name: string;
    slug: string;
    price: number | null;
    discount_price: number | null;
    images: string[] | null;
    stock_quantity: number | null;
    is_active: boolean | null;
  } | null;
}): WishlistPreviewItem | null {
  const p = row.products;
  if (!p) return null;
  return {
    id: row.id,
    productId: row.product_id,
    name: p.name,
    slug: p.slug,
    price: p.price ?? 0,
    discountPrice: p.discount_price ?? null,
    image: p.images?.[0] ?? '',
    inStock: (p.stock_quantity ?? 0) > 0 && !!p.is_active,
    addedAt: row.created_at,
  };
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  ids: EMPTY_IDS,
  items: [],
  count: 0,
  status: 'idle',
  isOpen: false,
  revision: 0,

  hydrate: async () => {
    // Only the very first caller fetches. Every product card calls `hydrate()`
    // on mount, so a guard on `'loading'` alone would let any card that mounts
    // after the first request settles start a second one — 24 cards, 24
    // requests, the exact problem this store exists to remove. `'idle'` is
    // reset by `reset()` on sign-out, which is what makes a fresh hydrate
    // possible for the next user.
    if (get().status !== 'idle') return;
    set({ status: 'loading' });

    try {
      const res = await fetch('/api/v1/wishlist/summary');
      if (!res.ok) throw new Error('Wishlist summary failed');
      const json = (await res.json()) as {
        success: boolean;
        data?: { count?: number; productIds?: string[] };
      };
      if (!json.success) throw new Error('Wishlist summary failed');

      const productIds = json.data?.productIds ?? [];
      const ids: Record<string, true> = {};
      for (const id of productIds) ids[id] = true;

      set({
        ids,
        count: json.data?.count ?? productIds.length,
        status: 'ready',
      });
    } catch {
      // A guest, an offline blip or a 5xx must not leave the store wedged in
      // `loading`: hearts fall back to "not saved" and the badge stays hidden.
      set({ status: 'ready' });
    }
  },

  markSaved: (productId) =>
    set((state) => {
      if (state.ids[productId]) return state;
      return {
        ids: { ...state.ids, [productId]: true },
        count: state.count + 1,
        revision: state.revision + 1,
      };
    }),

  markRemoved: (productId) =>
    set((state) => {
      if (!state.ids[productId]) return state;
      const ids = { ...state.ids };
      delete ids[productId];
      return {
        ids,
        // `count` is the server's number, which the drawer may have only
        // partially seen; never let it drift negative on a double-tap.
        count: Math.max(0, state.count - 1),
        revision: state.revision + 1,
      };
    }),

  addItem: (item) => {
    get().markSaved(item.productId);
    set((state) =>
      state.items.some((existing) => existing.productId === item.productId)
        ? state
        : {
            items: [item, ...state.items].slice(0, WISHLIST_DRAWER_LIMIT),
          }
    );
  },

  setItems: (items) => set({ items: items.slice(0, WISHLIST_DRAWER_LIMIT) }),

  removeItem: (productId) => {
    get().markRemoved(productId);
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    }));
  },

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  reset: () =>
    set({
      ids: EMPTY_IDS,
      items: [],
      count: 0,
      status: 'idle',
      isOpen: false,
      // Revision is per-user state: carrying the previous shopper's counter
      // would make the pages re-fetch once for a change that never happened.
      revision: 0,
    }),
}));