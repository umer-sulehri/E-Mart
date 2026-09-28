/**
 * Comparison rules for the compare page.
 *
 * Kept free of React and of the Zustand store so the policy can be unit tested
 * directly (the suite is Node-only, with no jsdom).
 *
 * A specification table only means anything within one category: "compare 3
 * phones" is useful, "compare a phone with a banana" is not, because there are
 * no shared rows to line up. So the compare tray is partitioned into one group
 * per category, and only the active group is ever rendered as a table.
 *
 * Crucially, a product in the wrong category is *not* refused. It is saved to
 * the tray like any other product and simply waits in its own group until the
 * user switches to it. Blocking the add would mean losing the product entirely,
 * which is what a shopper comparing across three departments expects to be
 * able to do.
 */

/** Maximum products rendered side by side in one comparison. */
export const MAX_COMPARE_ITEMS = 5;

/**
 * Ceiling on the whole saved tray, across all category groups.
 *
 * A separate bound from {@link MAX_COMPARE_ITEMS} because the two answer
 * different questions: the per-group cap protects the width of the table, this
 * one bounds session storage and the size of the switcher rail. Twenty is
 * enough to hold several full comparisons without the tray becoming a second
 * wishlist.
 */
export const MAX_SAVED_COMPARE_ITEMS = 20;

/** Label used when a product's category cannot be resolved. */
export const UNCATEGORISED_LABEL = 'Uncategorised';

/** The subset of a compare item the rules need to make a decision. */
export interface CompareCandidate {
  id: string;
  categoryId: string;
}

/** One category's worth of saved products, as rendered in the switcher rail. */
export interface CompareGroup<T extends CompareCandidate = CompareCandidate> {
  categoryId: string;
  /** Human-readable category name, falling back to a generic label. */
  label: string;
  items: T[];
}

export type AddItemDecision =
  | { allowed: true; groupLabel: string; isNewGroup: boolean }
  | { allowed: false; reason: 'duplicate'; existing: CompareCandidate }
  | {
      allowed: false;
      reason: 'category-full';
      /** The category that already holds the cap. */
      categoryId: string;
      label: string;
      limit: number;
    }
  | { allowed: false; reason: 'tray-full'; limit: number };

/** A candidate that also carries a display name, used to label new groups. */
export interface LabelledCompareCandidate extends CompareCandidate {
  category?: string;
}

/**
 * Decide whether `candidate` may be saved to the tray.
 *
 * Order matters. A product already saved reports `duplicate` even when the tray
 * is full, so toggling an existing item off stays possible at the cap. The
 * per-category cap is reported before the tray cap because it is the limit the
 * user is most likely to be up against, and because it names the category to
 * act on.
 */
export function canAddToCompare(
  items: readonly CompareCandidate[],
  candidate: LabelledCompareCandidate
): AddItemDecision {
  const existing = items.find((item) => item.id === candidate.id);
  if (existing) {
    return { allowed: false, reason: 'duplicate', existing };
  }

  const group = items.filter((item) => item.categoryId === candidate.categoryId);
  if (group.length >= MAX_COMPARE_ITEMS) {
    return {
      allowed: false,
      reason: 'category-full',
      categoryId: candidate.categoryId,
      label: resolveGroupLabel(candidate),
      limit: MAX_COMPARE_ITEMS,
    };
  }

  if (items.length >= MAX_SAVED_COMPARE_ITEMS) {
    return { allowed: false, reason: 'tray-full', limit: MAX_SAVED_COMPARE_ITEMS };
  }

  return {
    allowed: true,
    groupLabel: resolveGroupLabel(candidate),
    isNewGroup: group.length === 0,
  };
}

/** How many more products `categoryId` can take, given the current tray. */
export function remainingCompareSlots(
  items: readonly CompareCandidate[],
  categoryId: string
): number {
  const used = items.filter((item) => item.categoryId === categoryId).length;
  return Math.max(0, MAX_COMPARE_ITEMS - used);
}

/** How many more products the tray as a whole can accept. */
export function remainingTraySlots(count: number): number {
  return Math.max(0, MAX_SAVED_COMPARE_ITEMS - count);
}

/**
 * Partitions the tray into one group per category, in the order each category
 * was first added.
 *
 * First-seen order is deliberate: the group the user started with stays at the
 * front of the rail, so the default comparison never moves out from under them
 * just because they added a product elsewhere.
 */
export function groupItemsByCategory<T extends LabelledCompareCandidate>(
  items: readonly T[]
): CompareGroup<T>[] {
  const groups = new Map<string, T[]>();
  const labels = new Map<string, string>();

  for (const item of items) {
    const bucket = groups.get(item.categoryId);
    if (bucket) {
      bucket.push(item);
      // Call sites differ in how much they know about a product: a product card
      // always has the category name, a deep-linked one may not. Upgrade the
      // label as soon as any item in the group supplies a real name, rather
      // than letting the first (poorest) item decide the group's name forever.
      if (labels.get(item.categoryId) === UNCATEGORISED_LABEL) {
        const name = item.category?.trim();
        if (name) labels.set(item.categoryId, name);
      }
      continue;
    }
    groups.set(item.categoryId, [item]);
    labels.set(item.categoryId, resolveGroupLabel(item));
  }

  return Array.from(groups, ([categoryId, groupItems]) => ({
    categoryId,
    label: labels.get(categoryId) ?? UNCATEGORISED_LABEL,
    items: groupItems,
  }));
}

/**
 * The group the comparison table should render.
 *
 * Falls back to the first group whenever `activeCategoryId` is absent or no
 * longer matches anything — which happens the moment the last product of the
 * active group is removed, and on a session rehydrated from an older shape.
 */
export function resolveActiveGroup<T extends CompareCandidate>(
  groups: readonly CompareGroup<T>[],
  activeCategoryId: string | null | undefined
): CompareGroup<T> | null {
  if (groups.length === 0) return null;
  // `''` is a legitimate category id — a product whose category could not be
  // resolved forms its own group — so the check has to be against null/undefined
  // rather than truthiness, or that group could never be activated.
  if (activeCategoryId !== null && activeCategoryId !== undefined) {
    const match = groups.find((group) => group.categoryId === activeCategoryId);
    if (match) return match;
  }
  return groups[0];
}

/**
 * Human-readable category name.
 *
 * Products reach the tray from four call sites with four different levels of
 * completeness, and the raw category uuid must never reach the UI: a shopper
 * cannot act on it, and a uuid in a "Category" table cell is noise. An
 * unnameable category becomes one clearly-labelled group instead.
 */
export function resolveGroupLabel(item: {
  category?: string;
  categoryId?: string;
}): string {
  const name = item.category?.trim();
  if (name) return name;
  return UNCATEGORISED_LABEL;
}
