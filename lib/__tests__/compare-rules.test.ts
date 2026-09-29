import { describe, it, expect } from 'vitest';
import {
  MAX_COMPARE_ITEMS,
  UNCATEGORISED_LABEL,
  canAddToCompare,
  lockedCategoryId,
  reconcileCompareItems,
  remainingCompareSlots,
  resolveGroupLabel,
  type CompareCandidate,
  type LabelledCompareCandidate,
} from '../compare-rules';

function item(
  id: string,
  categoryId = 'cat-phones',
  category = 'Phones'
): LabelledCompareCandidate {
  return { id, categoryId, category };
}

function trayOf(count: number, categoryId = 'cat-phones'): CompareCandidate[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    categoryId,
  }));
}

describe('MAX_COMPARE_ITEMS', () => {
  it('is a comparison size a shopper can actually scan', () => {
    expect(MAX_COMPARE_ITEMS).toBe(5);
    // Three columns is the usual ceiling before the table stops being readable;
    // this is a ceiling, not a target.
    expect(MAX_COMPARE_ITEMS).toBeGreaterThan(1);
  });
});

describe('canAddToCompare', () => {
  it('accepts the first product, whatever its category', () => {
    expect(canAddToCompare([], item('a'))).toEqual({ allowed: true });
  });

  it('accepts products from the same category', () => {
    const tray = trayOf(2);
    expect(canAddToCompare(tray, item('new'))).toEqual({ allowed: true });
  });

  it('refuses a product from a different category', () => {
    const tray = trayOf(1);
    const decision = canAddToCompare(tray, item('other', 'cat-bakery', 'Bakery'));

    expect(decision.allowed).toBe(false);
    if (decision.allowed) return;
    expect(decision.reason).toBe('category-mismatch');
  });

  it('names the category the tray is locked to, so the message is actionable', () => {
    const tray: CompareCandidate[] = [
      { id: 'a', categoryId: 'cat-bakery' },
    ];
    const decision = canAddToCompare(
      tray,
      item('other', 'cat-phones', 'Phones')
    );

    if (decision.allowed) throw new Error('expected a refusal');
    // The label has to describe the tray, not the refused product: telling the
    // user "your list has Phones products" when it holds Bakery is worse than
    // saying nothing.
    expect(decision.reason).toBe('category-mismatch');
    if (decision.reason !== 'category-mismatch') return;
    // The tray item carries no display name, so the label degrades gracefully.
    expect(decision.label).toBe(UNCATEGORISED_LABEL);
    expect(decision.categoryId).toBe('cat-bakery');
  });

  it('uses the display name of the tray category when one is available', () => {
    const tray: LabelledCompareCandidate[] = [
      { id: 'a', categoryId: 'cat-bakery', category: 'Bakery' },
    ];
    const decision = canAddToCompare(
      tray,
      item('other', 'cat-phones', 'Phones')
    );

    if (decision.allowed || decision.reason !== 'category-mismatch') {
      throw new Error('expected a category-mismatch refusal');
    }
    expect(decision.label).toBe('Bakery');
  });

  it('refuses everything else once the tray is locked to a category', () => {
    // The lock is established by the first product and is not negotiable per
    // item, so a later product cannot open a second category by arriving first
    // in the UI.
    const tray = trayOf(3, 'cat-bakery');
    const decision = canAddToCompare(tray, item('late', 'cat-phones', 'Phones'));

    if (decision.allowed || decision.reason !== 'category-mismatch') {
      throw new Error('expected a category-mismatch refusal');
    }
    expect(decision.label).toBe(UNCATEGORISED_LABEL);
  });

  it('treats an unknown category as a category of its own', () => {
    // Two products that both lack a category are only as comparable as each
    // other; a known category must not be lumped in with them, and the empty
    // string must not match a real id.
    const tray: CompareCandidate[] = [{ id: 'a', categoryId: '' }];
    expect(canAddToCompare(tray, item('b', '')).allowed).toBe(true);
    expect(canAddToCompare(tray, item('c', 'cat-phones')).allowed).toBe(false);
  });

  it('does not confuse a real category with the uncategorised placeholder', () => {
    const tray: CompareCandidate[] = [{ id: 'a', categoryId: 'cat-phones' }];
    expect(canAddToCompare(tray, item('b', '')).allowed).toBe(false);
  });

  it('reports a duplicate before anything else', () => {
    // Removal has to stay possible at the cap, so an already-saved product
    // reports `duplicate` even when the tray cannot take another one.
    const tray = trayOf(MAX_COMPARE_ITEMS);
    const decision = canAddToCompare(tray, item('p0'));

    if (decision.allowed || decision.reason !== 'duplicate') {
      throw new Error('expected a duplicate refusal');
    }
    expect(decision.existing.id).toBe('p0');
  });

  it('reports a duplicate from another category as a duplicate, not a mismatch', () => {
    // The product is in the tray, so the user is toggling it off. Refusing with
    // a category message here would be confusing and would block the removal.
    const tray: CompareCandidate[] = [{ id: 'a', categoryId: 'cat-bakery' }];
    const decision = canAddToCompare(
      tray,
      item('a', 'cat-phones', 'Phones')
    );

    if (decision.allowed || decision.reason !== 'duplicate') {
      throw new Error('expected a duplicate refusal');
    }
  });

  it('refuses a sixth product in the locked category', () => {
    const tray = trayOf(MAX_COMPARE_ITEMS);
    const decision = canAddToCompare(tray, item('new'));

    if (decision.allowed || decision.reason !== 'category-full') {
      throw new Error('expected a category-full refusal');
    }
    expect(decision.limit).toBe(MAX_COMPARE_ITEMS);
  });

  it('accepts the fifth product in the locked category', () => {
    expect(canAddToCompare(trayOf(MAX_COMPARE_ITEMS - 1), item('new')).allowed).toBe(
      true
    );
  });

  it('prefers the mismatch message over the cap message', () => {
    // A full tray in one category would otherwise report `category-full` for
    // every foreign product, which explains the wrong problem.
    const tray = trayOf(MAX_COMPARE_ITEMS, 'cat-bakery');
    const decision = canAddToCompare(tray, item('new', 'cat-phones', 'Phones'));

    if (decision.allowed || decision.reason !== 'category-mismatch') {
      throw new Error('expected a category-mismatch refusal');
    }
  });
});

describe('remainingCompareSlots', () => {
  it('reports the whole allowance for an empty tray', () => {
    expect(remainingCompareSlots([])).toBe(MAX_COMPARE_ITEMS);
  });

  it('subtracts what is already saved', () => {
    expect(remainingCompareSlots(trayOf(3))).toBe(MAX_COMPARE_ITEMS - 3);
  });

  it('never goes negative, however bad the input', () => {
    expect(remainingCompareSlots(trayOf(MAX_COMPARE_ITEMS))).toBe(0);
    expect(remainingCompareSlots(trayOf(99))).toBe(0);
  });
});

describe('lockedCategoryId', () => {
  it('is null while the tray is empty, so any product can start a comparison', () => {
    expect(lockedCategoryId([])).toBeNull();
  });

  it('is the category of the first saved product', () => {
    // The first product defines the lock; later ones only join it.
    expect(lockedCategoryId(trayOf(3, 'cat-bakery'))).toBe('cat-bakery');
  });
});

describe('resolveGroupLabel', () => {
  it('prefers the display name', () => {
    expect(resolveGroupLabel({ category: 'Phones', categoryId: 'cat-phones' })).toBe(
      'Phones'
    );
  });

  it('never surfaces a raw uuid when a name is missing', () => {
    // A shopper cannot act on an id, and one in a table cell is noise.
    expect(resolveGroupLabel({ categoryId: '3f9a2c14-uuid' })).toBe(
      UNCATEGORISED_LABEL
    );
  });

  it('treats a blank name as missing', () => {
    expect(resolveGroupLabel({ category: '   ', categoryId: 'cat-1' })).toBe(
      UNCATEGORISED_LABEL
    );
  });

  it('falls back to one clearly-labelled name, not an empty cell', () => {
    expect(resolveGroupLabel({})).toBe(UNCATEGORISED_LABEL);
  });

  it('trims surrounding whitespace', () => {
    expect(resolveGroupLabel({ category: '  Phones  ' })).toBe('Phones');
  });
});

describe('reconcileCompareItems', () => {
  it('keeps a single-category tray untouched', () => {
    const tray = trayOf(3);
    expect(reconcileCompareItems(tray)).toEqual(tray);
  });

  it('keeps only the first category, which is what repairs a stale session', () => {
    // This is the case that matters in production: a tray written while the
    // store allowed several categories would otherwise rehydrate and render a
    // table whose rows do not line up.
    const stale = [
      { id: 'a', categoryId: 'cat-phones' },
      { id: 'b', categoryId: 'cat-phones' },
      { id: 'c', categoryId: 'cat-bakery' },
      { id: 'd', categoryId: 'cat-phones' },
    ];

    expect(reconcileCompareItems(stale).map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('stops at the first foreign product rather than skipping past it', () => {
    // Order is add-order, so the first foreign product is where the old tray
    // changed category. Dropping it and keeping later same-category products
    // would silently reorder the user's list.
    const stale = [
      { id: 'a', categoryId: 'cat-phones' },
      { id: 'b', categoryId: 'cat-bakery' },
      { id: 'c', categoryId: 'cat-phones' },
    ];

    expect(reconcileCompareItems(stale).map((i) => i.id)).toEqual(['a']);
  });

  it('drops duplicates, keeping the first occurrence', () => {
    const dupes = [
      { id: 'a', categoryId: 'cat-phones' },
      { id: 'a', categoryId: 'cat-phones' },
      { id: 'b', categoryId: 'cat-phones' },
    ];

    expect(reconcileCompareItems(dupes).map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('enforces the cap on a tray that was saved over it', () => {
    const over = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i}`,
      categoryId: 'cat-phones',
    }));

    expect(reconcileCompareItems(over)).toHaveLength(MAX_COMPARE_ITEMS);
  });

  it('handles an empty tray', () => {
    expect(reconcileCompareItems([])).toEqual([]);
  });

  it('leaves every retained item one category, so the table always lines up', () => {
    const stale = [
      { id: 'a', categoryId: 'cat-phones' },
      { id: 'b', categoryId: 'cat-phones' },
      { id: 'c', categoryId: 'cat-bakery' },
    ];

    const kept = reconcileCompareItems(stale);
    expect(new Set(kept.map((i) => i.categoryId)).size).toBe(1);
  });

  it('produces a tray that accepts its own category again', () => {
    // The repaired tray has to be usable: if reconcile returned something the
    // store would then refuse, the user would be stuck with a full list they
    // cannot add to or clear.
    const stale = [
      { id: 'a', categoryId: 'cat-phones' },
      { id: 'b', categoryId: 'cat-bakery' },
    ];
    const kept = reconcileCompareItems(stale);

    expect(canAddToCompare(kept, item('c', 'cat-phones', 'Phones')).allowed).toBe(
      true
    );
  });
});
