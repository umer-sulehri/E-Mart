/**
 * Comparison rules for the compare page.
 *
 * Kept free of React and of the Zustand store so the policy can be unit tested
 * directly (the suite is Node-only, with no jsdom).
 *
 * A comparison is only meaningful within one category: "compare 3 phones" is
 * useful, "compare a phone with a banana" is not, and the spec table below has
 * no shared rows. So the first product added defines the comparison's
 * category and every subsequent product must match it.
 */

/** Maximum products per comparison. Five keeps the spec table readable. */
export const MAX_COMPARE_ITEMS = 5;

/** The subset of a compare item the rules need to make a decision. */
export interface CompareCandidate {
  id: string;
  categoryId: string;
}

export type AddItemDecision =
  | { allowed: true }
  | { allowed: false; reason: 'duplicate'; existing: CompareCandidate }
  | { allowed: false; reason: 'limit-reached'; limit: number }
  | {
      allowed: false;
      reason: 'category-mismatch';
      activeCategoryId: string;
    };

/**
 * Decide whether `candidate` may join the current comparison.
 *
 * Order matters. A product already in the list reports `duplicate` even when
 * the list is full, so toggling an existing item off stays possible at the
 * limit.
 */
export function canAddToCompare(
  items: CompareCandidate[],
  candidate: CompareCandidate
): AddItemDecision {
  const existing = items.find((item) => item.id === candidate.id);
  if (existing) {
    return { allowed: false, reason: 'duplicate', existing };
  }

  if (items.length >= MAX_COMPARE_ITEMS) {
    return { allowed: false, reason: 'limit-reached', limit: MAX_COMPARE_ITEMS };
  }

  // The first product defines the category. An empty list is always allowed.
  const activeCategoryId = items[0]?.categoryId;
  if (activeCategoryId !== undefined && candidate.categoryId !== activeCategoryId) {
    return { allowed: false, reason: 'category-mismatch', activeCategoryId };
  }

  return { allowed: true };
}

/** How many more products fit, given the current list size. */
export function remainingCompareSlots(count: number): number {
  return Math.max(0, MAX_COMPARE_ITEMS - count);
}
