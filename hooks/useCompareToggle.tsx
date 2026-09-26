'use client';

import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useCompareStore, MAX_COMPARE_ITEMS, type CompareItem } from '@/store/compareStore';
import { trackEvent } from '@/lib/analytics';
import CompareCategoryDialog from '@/components/compare/CompareCategoryDialog';

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
  /** Whether the given product is currently in the comparison. */
  isCompared: (productId: string) => boolean;
  /** Add the product if it fits, or remove it if already present. */
  toggle: (product: ComparableProduct) => void;
  /**
   * Ready-to-render cross-category dialog. Render it once per component that
   * calls this hook, alongside the rest of the tree.
   */
  dialog: React.ReactElement | null;
}

function categoryName(product: { category?: string; categoryId?: string }): string {
  return product.category || product.categoryId || 'another category';
}

/**
 * Encapsulates the full "add to compare" interaction: the same-category rule,
 * the five-product cap, removal, and the analytics event.
 *
 * The store returns a decision rather than a boolean, and every caller would
 * otherwise repeat the same three-way switch, the toast wording and the dialog
 * wiring. Centralised here so a card, a quick view and the detail page cannot
 * drift apart.
 */
export function useCompareToggle(): UseCompareToggle {
  const items = useCompareStore((s) => s.items);
  const addItem = useCompareStore((s) => s.addItem);
  const removeItem = useCompareStore((s) => s.removeItem);
  const clearAll = useCompareStore((s) => s.clearAll);

  const [pending, setPending] = useState<CompareItem | null>(null);

  const toCompareItem = useCallback(
    (product: ComparableProduct): CompareItem => ({
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
    }),
    []
  );

  const startOver = useCallback(() => {
    if (!pending) return;
    clearAll();
    addItem(pending);
    setPending(null);
    trackEvent({
      action: 'compare_add',
      category: 'product',
      label: `${pending.slug}:restart`,
    });
    toast.success('Started a new comparison');
  }, [pending, clearAll, addItem]);

  const toggle = useCallback(
    (product: ComparableProduct) => {
      const existing = items.find((i) => i.id === product.id);
      if (existing) {
        removeItem(product.id);
        trackEvent({
          action: 'compare_remove',
          category: 'product',
          label: product.slug,
        });
        toast.success('Removed from compare');
        return;
      }

      const decision = addItem(toCompareItem(product));
      if (decision.allowed) {
        trackEvent({ action: 'compare_add', category: 'product', label: product.slug });
        toast.success('Added to compare');
        return;
      }

      switch (decision.reason) {
        case 'category-mismatch':
          setPending(toCompareItem(product));
          break;
        case 'limit-reached':
          toast.error(`You can compare up to ${MAX_COMPARE_ITEMS} products`);
          break;
        case 'duplicate':
          // The store changed between render and click; nothing to do.
          break;
      }
    },
    [items, addItem, removeItem, toCompareItem]
  );

  const isCompared = useCallback(
    (productId: string) => items.some((i) => i.id === productId),
    [items]
  );

  const dialog =
    pending === null ? null : (
      <CompareCategoryDialog
        open
        activeCategory={categoryName(items[0] || {})}
        incomingCategory={categoryName(pending)}
        onClose={() => setPending(null)}
        onStartOver={startOver}
      />
    );

  return { isCompared, toggle, dialog };
}
