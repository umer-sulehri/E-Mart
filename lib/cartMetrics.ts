import type { CartItem } from '@/types';

export interface CartMetrics {
  /** Number of unique product line items in the cart. */
  uniqueItemCount: number;
  /** Sum of all line-item quantities (total units). */
  totalQuantity: number;
  /** Sum of all line-item totals before tax/shipping/discounts. */
  subtotal: number;
}

/**
 * Computes the derived cart metrics from the raw line items.
 *
 * Kept as a pure, framework-free function so the semantics can be unit
 * tested independently of the Zustand store (persist/localStorage/fetch).
 */
export function computeCartMetrics(items: CartItem[]): CartMetrics {
  let totalQuantity = 0;
  let subtotal = 0;
  for (const item of items) {
    totalQuantity += item.quantity;
    subtotal += item.totalPrice;
  }
  return {
    uniqueItemCount: items.length,
    totalQuantity,
    subtotal,
  };
}

/**
 * Returns a count for display badges.
 * @deprecated Use computeCartMetrics().totalQuantity instead.
 */
export function sumQuantities(items: CartItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}