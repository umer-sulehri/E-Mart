'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  useCompareStore,
  MAX_COMPARE_ITEMS,
  type CompareItem,
} from '@/store/compareStore';
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
 * Encapsulates the full "add to compare" interaction: the per-category and tray
 * caps, removal, the toast wording, and the analytics event.
 *
 * The store returns a decision rather than a boolean, and every caller would
 * otherwise repeat the same switch and pick its own wording. Centralised here so
 * a card, a quick view and the detail page cannot drift apart.
 */
export function useCompareToggle(): UseCompareToggle {
  const items = useCompareStore((s) => s.items);
  const addItem = useCompareStore((s) => s.addItem);
  const removeItem = useCompareStore((s) => s.removeItem);

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

      switch (decision.reason) {
        case 'category-mismatch':
          // The most common refusal, so it gets the most specific wording: which
          // category the tray is holding, and what the user has to do next.
          toast.error(
            `Your compare list has ${decision.label} products. Only products from the same category can be compared — clear the list to start a new one.`
          );
          break;
        case 'category-full':
          toast.error(
            `You can compare up to ${MAX_COMPARE_ITEMS} ${decision.label} products. Remove one to swap it.`
          );
          break;
        case 'duplicate':
          // The store changed between render and click; nothing to do.
          break;
      }
    },
    [items, addItem, removeItem]
  );

  const isCompared = useCallback(
    (productId: string) => items.some((i) => i.id === productId),
    [items]
  );

  return { isCompared, toggle };
}
