/**
 * Comparison rules for the compare page.
 *
 * Kept free of React and of the Zustand store so the policy can be unit tested
 * directly (the suite is Node-only, with no jsdom).
 *
 * A specification table only means anything within one category: "compare 3
 * phones" is useful, "compare a phone with a banana" is not, because there are
 * no shared rows to line up. So the tray holds a single category at a time.
 *
 * A product in a different category is *refused*, not parked. The first product
 * the user saves fixes the tray's category, and every later add has to match it.
 * That is a deliberate trade-off: the shopper has to clear the list to compare
 * something else, but they are never shown a table whose rows do not line up, and
 * the tray can never quietly grow into a second wishlist.
 */

/** Maximum products rendered side by side in one comparison. */
export const MAX_COMPARE_ITEMS = 5;

/** Label used when a product's category cannot be resolved. */
export const UNCATEGORISED_LABEL = 'Uncategorised';

/** The subset of a compare item the rules need to make a decision. */
export interface CompareCandidate {
  id: string;
  categoryId: string;
}

/** A candidate that also carries a display name, used in the refusal message. */
export interface LabelledCompareCandidate extends CompareCandidate {
  category?: string;
}

export type AddItemDecision =
  | { allowed: true }
  | { allowed: false; reason: 'duplicate'; existing: CompareCandidate }
  | {
      allowed: false;
      /** The tray already holds products from a different category. */
      reason: 'category-mismatch';
      /** Display name of the category the tray is currently locked to. */
      label: string;
      categoryId: string;
    }
  | { allowed: false; reason: 'category-full'; label: string; limit: number };

/**
 * Decide whether `candidate` may be saved to the tray.
 *
 * Order matters. A product already saved reports `duplicate` even when the tray
 * is at the cap, so toggling an existing item off stays possible at the limit.
 * The category check comes next: it is the rule the user is most likely to hit,
 * and it is the one that has to be explained in full, so it names the category
 * the tray is locked to.
 */
export function canAddToCompare(
  items: readonly CompareCandidate[],
  candidate: LabelledCompareCandidate
): AddItemDecision {
  const existing = items.find((item) => item.id === candidate.id);
  if (existing) {
    return { allowed: false, reason: 'duplicate', existing };
  }

  // The tray is locked to the category of its first saved product. An empty tray
  // adopts whatever the candidate brings.
  const incumbent = items[0];
  if (incumbent && incumbent.categoryId !== candidate.categoryId) {
    return {
      allowed: false,
      reason: 'category-mismatch',
      label: resolveGroupLabel(incumbent),
      categoryId: incumbent.categoryId,
    };
  }

  if (items.length >= MAX_COMPARE_ITEMS) {
    return {
      allowed: false,
      reason: 'category-full',
      label: resolveGroupLabel(candidate),
      limit: MAX_COMPARE_ITEMS,
    };
  }

  return { allowed: true };
}

/** How many more products the tray can accept. */
export function remainingCompareSlots(items: readonly CompareCandidate[]): number {
  return Math.max(0, MAX_COMPARE_ITEMS - items.length);
}

/**
 * The category a tray is locked to, or `null` while it is empty.
 *
 * Callers use this to disable or annotate search results before the user clicks,
 * rather than letting them add and then be refused.
 */
export function lockedCategoryId(
  items: readonly CompareCandidate[]
): string | null {
  return items[0]?.categoryId ?? null;
}

/**
 * Human-readable category name.
 *
 * Products reach the tray from several call sites with different levels of
 * completeness, and the raw category uuid must never reach the UI: a shopper
 * cannot act on it, and a uuid in a "Category" table cell is noise. An unnameable
 * category falls back to one clearly-labelled name.
 */
export function resolveGroupLabel(item: {
  category?: string;
  categoryId?: string;
}): string {
  const name = item.category?.trim();
  if (name) return name;
  return UNCATEGORISED_LABEL;
}

/**
 * Reduce a rehydrated tray to one legal comparison.
 *
 * Session storage can outlive a deployment, so its contents cannot be assumed to
 * match the current rules — and after a switch back to single-category compare, a
 * tray written by the previous version really can hold several categories. Keep
 * the first category's products, in the order they were added, deduplicated and
 * capped, and drop everything else.
 */
export function reconcileCompareItems<
  T extends CompareCandidate,
>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  const kept: T[] = [];

  for (const item of items) {
    if (seen.has(item.id)) continue;
    if (kept.length >= MAX_COMPARE_ITEMS) break;
    // The first item defines the category; anything else is not comparable.
    if (kept.length > 0 && kept[0].categoryId !== item.categoryId) break;
    seen.add(item.id);
    kept.push(item);
  }

  return kept;
}
