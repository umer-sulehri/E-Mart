import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  useWishlistStore,
  toWishlistItem,
} from '@/store/wishlistStore';
import { WISHLIST_DRAWER_LIMIT } from '@/lib/constants';
import type { WishlistPreviewItem } from '@/types';

function makeItem(
  productId: string,
  overrides: Partial<WishlistPreviewItem> = {}
): WishlistPreviewItem {
  return {
    id: `row-${productId}`,
    productId,
    name: `Product ${productId}`,
    slug: `product-${productId}`,
    price: 1000,
    discountPrice: null,
    image: '/images/products/p.webp',
    inStock: true,
    addedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('wishlist store', () => {
  beforeEach(() => {
    useWishlistStore.getState().reset();
  });

  it('starts empty and closed', () => {
    const state = useWishlistStore.getState();
    expect(state.ids).toEqual({});
    expect(state.items).toEqual([]);
    expect(state.count).toBe(0);
    expect(state.isOpen).toBe(false);
    expect(state.revision).toBe(0);
  });

  it('answers "is this saved?" per product', () => {
    const store = useWishlistStore.getState();
    store.markSaved('p1');

    expect(useWishlistStore.getState().ids['p1']).toBe(true);
    expect(useWishlistStore.getState().ids['p2']).toBeUndefined();
  });

  it('does not double-count a repeated save', () => {
    const store = useWishlistStore.getState();
    store.markSaved('p1');
    store.markSaved('p1');

    expect(useWishlistStore.getState().count).toBe(1);
    expect(useWishlistStore.getState().revision).toBe(1);
  });

  it('never drives the count negative on a repeated remove', () => {
    const store = useWishlistStore.getState();
    store.removeItem('missing');

    expect(useWishlistStore.getState().count).toBe(0);
    expect(useWishlistStore.getState().revision).toBe(0);
  });

  it('bumps revision so the wishlist pages can re-fetch', () => {
    const store = useWishlistStore.getState();
    store.markSaved('p1');
    expect(useWishlistStore.getState().revision).toBe(1);

    store.markRemoved('p1');
    expect(useWishlistStore.getState().revision).toBe(2);
  });

  it('trims the drawer list to the preview limit', () => {
    const store = useWishlistStore.getState();
    for (let i = 0; i < WISHLIST_DRAWER_LIMIT + 3; i++) {
      useWishlistStore.getState().addItem(makeItem(`p${i}`));
    }

    const { items, count } = useWishlistStore.getState();
    expect(items).toHaveLength(WISHLIST_DRAWER_LIMIT);
    // The badge keeps the server's total even though the drawer previews fewer.
    expect(count).toBe(WISHLIST_DRAWER_LIMIT + 3);
  });

  it('keeps the newest item at the top of the drawer', () => {
    useWishlistStore.getState().addItem(makeItem('first'));
    useWishlistStore.getState().addItem(makeItem('second'));

    expect(useWishlistStore.getState().items[0].productId).toBe('second');
  });

  it('removes the row as well as the id', () => {
    const store = useWishlistStore.getState();
    store.addItem(makeItem('p1'));
    useWishlistStore.getState().removeItem('p1');

    const state = useWishlistStore.getState();
    expect(state.items).toEqual([]);
    expect(state.ids['p1']).toBeUndefined();
    expect(state.count).toBe(0);
  });

  // The drawer renders `items`, and writes the list endpoint's rows in through
  // `setItems`. When it held its own copy in component state, `removeItem`
  // updated the store (the header badge dropped) while the row on screen came
  // from the other list, so nothing visibly happened.
  it('removes a row the drawer loaded through setItems', () => {
    useWishlistStore
      .getState()
      .setItems([makeItem('p1'), makeItem('p2'), makeItem('p3')]);

    expect(useWishlistStore.getState().items).toHaveLength(3);

    useWishlistStore.getState().removeItem('p2');

    const state = useWishlistStore.getState();
    expect(state.items.map((item) => item.productId)).toEqual(['p1', 'p3']);
    expect(state.count).toBe(0);
  });

  it('replaces the preview list rather than appending to it', () => {
    const store = useWishlistStore.getState();
    store.setItems([makeItem('p1'), makeItem('p2')]);
    store.setItems([makeItem('p3')]);

    expect(useWishlistStore.getState().items.map((i) => i.productId)).toEqual([
      'p3',
    ]);
  });

  it('caps a setItems list to the preview limit', () => {
    const many = Array.from({ length: WISHLIST_DRAWER_LIMIT + 5 }, (_, i) =>
      makeItem(`p${i}`)
    );
    useWishlistStore.getState().setItems(many);

    expect(useWishlistStore.getState().items).toHaveLength(
      WISHLIST_DRAWER_LIMIT
    );
  });

  it('toggles open state', () => {
    useWishlistStore.getState().toggle();
    expect(useWishlistStore.getState().isOpen).toBe(true);
    useWishlistStore.getState().toggle();
    expect(useWishlistStore.getState().isOpen).toBe(false);
  });

  it('clears everything on reset (sign-out)', () => {
    const store = useWishlistStore.getState();
    store.addItem(makeItem('p1'));
    useWishlistStore.getState().open();

    useWishlistStore.getState().reset();

    const state = useWishlistStore.getState();
    expect(state.ids).toEqual({});
    expect(state.items).toEqual([]);
    expect(state.count).toBe(0);
    expect(state.isOpen).toBe(false);
    expect(state.status).toBe('idle');
  });
});

describe('toWishlistItem', () => {
  it('flattens a joined row', () => {
    const item = toWishlistItem({
      id: 'row-1',
      product_id: 'p1',
      created_at: '2026-01-01T00:00:00.000Z',
      products: {
        name: 'Organic Apples',
        slug: 'organic-apples',
        price: 1200,
        discount_price: 900,
        images: ['/a.webp', '/b.webp'],
        stock_quantity: 4,
        is_active: true,
      },
    });

    expect(item).toEqual({
      id: 'row-1',
      productId: 'p1',
      name: 'Organic Apples',
      slug: 'organic-apples',
      price: 1200,
      discountPrice: 900,
      // Only the first image: the drawer renders a 64px thumbnail.
      image: '/a.webp',
      inStock: true,
      addedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('drops a row whose product no longer joins', () => {
    expect(
      toWishlistItem({
        id: 'row-1',
        product_id: 'p1',
        created_at: '2026-01-01T00:00:00.000Z',
        products: null,
      })
    ).toBeNull();
  });

  it('treats a missing stock quantity as out of stock', () => {
    const item = toWishlistItem({
      id: 'row-1',
      product_id: 'p1',
      created_at: '2026-01-01T00:00:00.000Z',
      products: {
        name: 'Deleted',
        slug: 'deleted',
        price: null,
        discount_price: null,
        images: null,
        stock_quantity: null,
        is_active: false,
      },
    });

    expect(item?.price).toBe(0);
    expect(item?.image).toBe('');
    expect(item?.inStock).toBe(false);
  });
});

describe('wishlist hydrate', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    useWishlistStore.getState().reset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('seeds ids and count from the summary response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { count: 2, productIds: ['p1', 'p2'] },
      }),
    }) as unknown as typeof fetch;

    await useWishlistStore.getState().hydrate();

    const state = useWishlistStore.getState();
    expect(state.status).toBe('ready');
    expect(state.count).toBe(2);
    expect(state.ids['p1']).toBe(true);
    expect(state.ids['p2']).toBe(true);
  });

  it('only fetches once: every product card calls hydrate on mount', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { count: 1, productIds: ['p1'] } }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await Promise.all([
      useWishlistStore.getState().hydrate(),
      useWishlistStore.getState().hydrate(),
      useWishlistStore.getState().hydrate(),
    ]);
    await useWishlistStore.getState().hydrate();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to "not ready" rather than wedging on failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false }),
    }) as unknown as typeof fetch;

    await useWishlistStore.getState().hydrate();

    const state = useWishlistStore.getState();
    expect(state.status).toBe('ready');
    expect(state.count).toBe(0);
  });
});