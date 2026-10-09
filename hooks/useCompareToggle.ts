'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  useCompareStore,
  MAX_COMPARE_ITEMS,
  type CompareItem,
} from '@/store/compareStore';
import { canAddToCompare, resolveGroupLabel } from '@/lib/compare-rules';
import { showCompareMismatchToast } from '@/components/compare/CompareMismatchToast';
import { trackEvent } from '@/lib/analytics';

/** The product fields a comparison entry needs. */
export type ComparableProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  categoryId: string;
  category?: string;
  brand?: string;
  inStock?: boolean;
};

/**
 * What a compare button should look like for a given product, before it is
 * clicked.
 *
 * Cards, the quick view and the detail page all render the same toggle, so this
 * is computed from the product alone and every entry point agrees. Reporting the
 * reason up front is what lets a card mark an out-of-category product instead of
 * letting the shopper click and then be refused.
 */
export type CompareEligibility =
  /** Already in the tray: the toggle removes it. */
  | { state: 'in-tray' }
  /** Can be added now. */
  | { state: 'addable' }
  /** Cannot be added; `reason` explains why, `blockedCategory` is the tray's category. */
  | {
      state: 'blocked';
      reason: 'category-mismatch' | 'category-full';
      message: string;
      /** Display name of the category the tray is locked to, for the tooltip. */
      blockedCategory: string;
    };

export interface UseCompareToggle {
  /** Whether the given product is currently in the tray. */
  isCompared: (productId: string) => boolean;
  /**
   * Add the product if it fits, or remove it if already present.
   *
   * Adding is refused when the tray already holds a different category, because
   * a specification table across unrelated products has no rows worth lining up.
   */
  toggle: (product: ComparableProduct) => void;
  /** How the button for this product should render right now. */
  eligibilityFor: (product: ComparableProduct) => CompareEligibility;
}

function toCompareItem(product: ComparableProduct): CompareItem {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    discountPrice: product.discountPrice,
    rating: product.rating,
    reviewCount: product.reviewCount,
    image: product.image,
    category: product.category || '',
    categoryId: product.categoryId,
    brand: product.brand || '',
    inStock: product.inStock ?? true,
  };
}

/**
 * The wording shared by the toast and the disabled button's tooltip.
 *
 * Returns the narrowed reason alongside the message rather than just the string:
 * a `duplicate` is not something to report (the store changed between render and
 * click), so callers need the reason to branch on, and TypeScript cannot infer
 * that from a nullable string.
 */
function explainRefusal(
  decision: Extract<ReturnType<typeof canAddToCompare>, { allowed: false }>
): { reason: 'category-mismatch' | 'category-full'; message: string } | null {
  switch (decision.reason) {
    case 'category-mismatch':
      // The most common refusal, so it gets the most specific wording: which
      // category the tray is holding, and what the user has to do next.
      return {
        reason: decision.reason,
        message: `Your compare list is comparing ${decision.label} products. Only products from the same category can be compared — clear the list to start a new one.`,
      };
    case 'category-full':
      return {
        reason: decision.reason,
        message: `You can compare up to ${MAX_COMPARE_ITEMS} ${decision.label} products. Remove one to swap it.`,
      };
    case 'duplicate':
      // Nothing to report: the tray no longer holds the product the click was
      // computed against, so the add would simply succeed on the next attempt.
      return null;
  }
}

/**
 * Encapsulates the full "add to compare" interaction: the per-category and tray
 * caps, removal, the toast wording, the "clear & add" escape hatch, and the
 * analytics event.
 *
 * The store returns a decision rather than a boolean, and every caller would
 * otherwise repeat the same switch and pick its own wording. Centralised here so
 * a card, a quick view and the detail page cannot drift apart.
 */
export function useCompareToggle(): UseCompareToggle {
  const items = useCompareStore((s) => s.items);
  const addItem = useCompareStore((s) => s.addItem);
  const removeItem = useCompareStore((s) => s.removeItem);
  const replaceWith = useCompareStore((s) => s.replaceWith);

  const eligibilityFor = useCallback(
    (product: ComparableProduct): CompareEligibility => {
      if (items.some((i) => i.id === product.id)) {
        return { state: 'in-tray' };
      }
      const decision = canAddToCompare(items, product);
      if (decision.allowed) return { state: 'addable' };

      const refusal = explainRefusal(decision);
      if (refusal === null) {
        // Duplicate reported against a tray that no longer holds the product:
        // treat it as addable rather than showing a reason that makes no sense.
        return { state: 'addable' };
      }
      return {
        state: 'blocked',
        reason: refusal.reason,
        message: refusal.message,
        blockedCategory:
          decision.reason === 'category-mismatch'
            ? decision.label
            : resolveGroupLabel(product),
      };
    },
    [items]
  );

  const toggle = useCallback(
    (product: ComparableProduct) => {
      const item = toCompareItem(product);

      if (items.some((i) => i.id === product.id)) {
        removeItem(product.id);
        trackEvent({
          action: 'compare_remove',
          category: 'product',
          label: product.slug,
        });
        toast.success('Removed from compare');
        return;
      }

      const decision = addItem(item);
      if (decision.allowed) {
        trackEvent({ action: 'compare_add', category: 'product', label: product.slug });
        toast.success('Added to compare');
        return;
      }

      const refusal = explainRefusal(decision);
      if (refusal === null) return;

      if (refusal.reason === 'category-mismatch') {
        // The only refusal where the shopper has a one-click way out, so it gets
        // a real action rather than an instruction to visit the compare page and
        // press Clear All themselves.
        showCompareMismatchToast({
          message: refusal.message,
          onClearAndAdd: () => {
            replaceWith(item);
            trackEvent({
              action: 'compare_replace',
              category: 'product',
              label: product.slug,
            });
            toast.success('Compare list cleared — now showing this product');
          },
        });
        return;
      }

      toast.error(refusal.message);
    },
    [items, addItem, removeItem, replaceWith]
  );

  const isCompared = useCallback(
    (productId: string) => items.some((i) => i.id === productId),
    [items]
  );

  return { isCompared, toggle, eligibilityFor };
}
