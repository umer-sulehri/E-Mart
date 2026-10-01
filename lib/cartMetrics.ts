import type { CartItem } from '@/types';

/** Persisted cart schema version. Bump when `CartItem` changes shape. */
export const CART_STORAGE_VERSION = 2;

/**
 * Line-item shape saved before `CART_STORAGE_VERSION` 2, when `CartItem.product`
 * embedded a full `Product` and the thumbnail lived in an `images[]` array.
 * Only the fields the cart reads are carried forward.
 */
export interface LegacyCartItem extends Omit<CartItem, 'product'> {
  product?: {
    id?: string;
    name?: string;
    slug?: string;
    image?: string;
    images?: string[];
    stockQuantity?: number;
  };
}

export interface LegacyCartState {
  items?: LegacyCartItem[];
}

/**
 * Rewrites a cart persisted under an older schema version into the current one.
 *
 * A user with a v1 cart must not silently lose their basket after deploy, so
 * the full embedded `Product` is narrowed to the snapshot the cart renders and
 * `images[0]` becomes the single `image` field.
 */
export function migrateCartState(persisted: unknown): unknown {
  const state = persisted as LegacyCartState | undefined;
  if (!state || !Array.isArray(state.items)) return persisted;

  return {
    ...state,
    items: state.items.map(({ product, ...item }) => ({
      ...item,
      product: {
        id: product?.id ?? item.productId,
        name: product?.name ?? 'Product',
        slug: product?.slug ?? '',
        image: product?.image ?? product?.images?.[0],
        stockQuantity: product?.stockQuantity ?? 0,
      },
    })),
  };
}

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