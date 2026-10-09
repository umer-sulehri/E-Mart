import { describe, it, expect, beforeEach } from 'vitest';
import { useCompareStore, MAX_COMPARE_ITEMS } from '@/store/compareStore';
import type { CompareItem } from '@/store/compareStore';

/**
 * Store-level coverage for the category lock.
 *
 * `compare-rules.test.ts` exercises the policy in isolation; these tests drive
 * the real store, because the bugs that reached production were integration
 * ones — a mutating action that returned a decision nobody checked, and a
 * rehydrated tray that was never sanitised.
 */

function item(
  id: string,
  categoryId = 'cat-phones',
  category = 'Phones'
): CompareItem {
  return {
    id,
    name: `Product ${id}`,
    slug: id,
    price: 1000,
    rating: 4,
    reviewCount: 10,
    image: '/images/product-thumb-1.webp',
    category,
    categoryId,
    inStock: true,
  };
}

const { addItem, replaceWith, removeItem, clearAll, reconcileItems } =
  useCompareStore.getState();

beforeEach(() => {
  useCompareStore.setState({ items: [] });
});

describe('addItem', () => {
  it('stores the first product and adopts its category', () => {
    expect(addItem(item('a')).allowed).toBe(true);
    expect(useCompareStore.getState().items).toHaveLength(1);
    expect(useCompareStore.getState().items[0].categoryId).toBe('cat-phones');
  });

  it('accepts further products from the same category', () => {
    addItem(item('a'));
    expect(addItem(item('b')).allowed).toBe(true);
    expect(addItem(item('c')).allowed).toBe(true);
    expect(useCompareStore.getState().items).toHaveLength(3);
  });

  it('refuses a product from another category and leaves the tray untouched', () => {
    addItem(item('a'));
    const decision = addItem(item('x', 'cat-bakery', 'Bakery'));

    expect(decision).toMatchObject({
      allowed: false,
      reason: 'category-mismatch',
      label: 'Phones',
      categoryId: 'cat-phones',
    });
    // The refusal must be inert: nothing is written on the rejected path.
    expect(useCompareStore.getState().items.map((i) => i.id)).toEqual(['a']);
  });

  it('never lets brand, price or rating influence eligibility', () => {
    addItem(item('a'));
    // Same category, wildly different everything else: still allowed.
    const different = {
      ...item('b'),
      name: 'Totally Different Product Name',
      price: 999999,
      rating: 1,
      inStock: false,
    };
    expect(addItem(different).allowed).toBe(true);
  });

  it('refuses a product past the cap and reports the cap, not the category', () => {
    for (let i = 0; i < MAX_COMPARE_ITEMS; i++) addItem(item(`p${i}`));

    const decision = addItem(item('extra'));
    expect(decision).toMatchObject({
      allowed: false,
      reason: 'category-full',
      limit: MAX_COMPARE_ITEMS,
    });
    expect(useCompareStore.getState().items).toHaveLength(MAX_COMPARE_ITEMS);
  });

  it('reports a duplicate before the cap, so a full tray can still be edited', () => {
    for (let i = 0; i < MAX_COMPARE_ITEMS; i++) addItem(item(`p${i}`));
    expect(addItem(item('p0'))).toMatchObject({
      allowed: false,
      reason: 'duplicate',
    });
  });
});

describe('removeItem', () => {
  it('releases the category lock when the tray empties', () => {
    addItem(item('a', 'cat-phones', 'Phones'));
    addItem(item('b', 'cat-phones', 'Phones'));
    removeItem('a');
    removeItem('b');

    expect(useCompareStore.getState().items).toEqual([]);
    // The lock is derived from the first item, so an empty tray must accept a
    // product from any category — this is what lets a shopper switch category.
    expect(addItem(item('z', 'cat-bakery', 'Bakery')).allowed).toBe(true);
  });

  it('re-locks to the new first item when the head of the tray is removed', () => {
    addItem(item('a', 'cat-phones', 'Phones'));
    addItem(item('b', 'cat-phones', 'Phones'));
    removeItem('a');

    expect(addItem(item('y', 'cat-bakery', 'Bakery')).allowed).toBe(false);
  });
});

describe('replaceWith', () => {
  it('discards a foreign tray and starts a new comparison', () => {
    addItem(item('a', 'cat-phones', 'Phones'));
    addItem(item('b', 'cat-bakery', 'Bakery'));

    replaceWith(item('c', 'cat-utensils', 'Utensils'));

    // This is the "Clear & add this instead" path, and the reported bug was
    // exactly a Utensils product sharing a table with Electronics.
    expect(useCompareStore.getState().items.map((i) => i.id)).toEqual(['c']);
    expect(useCompareStore.getState().items[0].categoryId).toBe('cat-utensils');
  });

  it('resets to a single-item tray even within the same category', () => {
    addItem(item('a', 'cat-phones', 'Phones'));
    replaceWith(item('b', 'cat-phones', 'Phones'));
    // The action is labelled "Clear & add this instead", so clearing is the
    // documented behaviour, not an accident — it must not silently append.
    expect(useCompareStore.getState().items.map((i) => i.id)).toEqual(['b']);
  });

  it('is inert for a product already in the tray', () => {
    addItem(item('a', 'cat-phones', 'Phones'));
    addItem(item('b', 'cat-phones', 'Phones'));
    replaceWith(item('a'));

    // Must not throw away a comparison the shopper built up.
    expect(useCompareStore.getState().items.map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('cannot smuggle a mixed tray back in', () => {
    addItem(item('a', 'cat-phones', 'Phones'));
    replaceWith(item('b', 'cat-bakery', 'Bakery'));
    // Adding to the replaced tray is still policed by the same rules.
    expect(addItem(item('c', 'cat-utensils', 'Utensils')).allowed).toBe(false);
  });
});

describe('clearAll', () => {
  it('empties the tray and releases the lock', () => {
    addItem(item('a'));
    clearAll();
    expect(useCompareStore.getState().items).toEqual([]);
    expect(addItem(item('b', 'cat-bakery', 'Bakery')).allowed).toBe(true);
  });
});

describe('reconcileItems', () => {
  it('repairs a tray left mixed by the previous cross-category behaviour', () => {
    // The exact shape observed in production: Electronics + Utensils + Fashion.
    useCompareStore.setState({
      items: [
        item('headphones', 'cat-electronics', 'Electronics'),
        item('spoon-set', 'cat-utensils', 'Utensils'),
        item('t-shirt', 'cat-fashion', 'Fashion'),
      ],
    });

    reconcileItems();

    const kept = useCompareStore.getState().items;
    expect(kept.map((i) => i.id)).toEqual(['headphones']);
    expect(new Set(kept.map((i) => i.categoryId)).size).toBe(1);
  });

  it('keeps a legal tray byte-for-byte', () => {
    useCompareStore.setState({
      items: [item('a'), item('b'), item('c')],
    });
    const before = useCompareStore.getState().items;
    reconcileItems();
    expect(useCompareStore.getState().items).toEqual(before);
  });

  it('drops duplicates from a tray saved with them', () => {
    useCompareStore.setState({ items: [item('a'), item('a'), item('b')] });
    reconcileItems();
    expect(useCompareStore.getState().items.map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('enforces the cap on a tray that was saved over it', () => {
    useCompareStore.setState({
      items: Array.from({ length: MAX_COMPARE_ITEMS + 3 }, (_, i) => item(`p${i}`)),
    });
    reconcileItems();
    expect(useCompareStore.getState().items).toHaveLength(MAX_COMPARE_ITEMS);
  });

  it('leaves a tray the store will accept again', () => {
    useCompareStore.setState({
      items: [
        item('a', 'cat-phones', 'Phones'),
        item('b', 'cat-bakery', 'Bakery'),
      ],
    });
    reconcileItems();
    expect(addItem(item('c', 'cat-phones', 'Phones')).allowed).toBe(true);
  });

  it('handles an empty tray', () => {
    reconcileItems();
    expect(useCompareStore.getState().items).toEqual([]);
  });
});

describe('addItem (post-reconcile)', () => {
  it('treats a product with no resolvable category as comparable with itself only', () => {
    addItem(item('a', '', 'Electronics'));
    const same = addItem(item('b', '', ''));
    const other = addItem(item('c', 'cat-bakery', 'Bakery'));
    expect(same.allowed).toBe(true);
    expect(other.allowed).toBe(false);
  });
});
