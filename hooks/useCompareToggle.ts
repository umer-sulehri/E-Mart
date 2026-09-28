'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  useCompareStore,
  MAX_COMPARE_ITEMS,
  MAX_SAVED_COMPARE_ITEMS,
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
   * Adding never fails on category grounds: a product from another category is
   * saved to its own group and surfaces in the compare page's switcher rail.
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
  const activeCategoryId = useCompareStore((s) => s.activeCategoryId);
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

        if (decision.isNewGroup && items.length > 0) {
          // The product is safe, it just is not in the group currently on
          // screen. Say so, otherwise the card's pressed state flips with no
          // visible change to the table and the control feels broken.
          toast.success(`Saved to compare · ${decision.groupLabel}`);
        } else {
          toast.success('Added to compare');
        }
        return;
      }

      switch (decision.reason) {
        case 'category-full':
          toast.error(
            `You can compare up to ${MAX_COMPARE_ITEMS} ${decision.label} products. Remove one to swap it.`
          );
          break;
        case 'tray-full':
          toast.error(
            `Your compare list is full (${MAX_SAVED_COMPARE_ITEMS}). Remove a product to add another.`
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
