/**
 * Pure helpers for deriving dashboard timeline / quick-action state from a
 * list of orders. Framework-free so it can be unit tested.
 */
import type { Order, OrderItem } from '@/types';

export interface QuickActionState {
  lastOrder: Order | null;
  hasOrders: boolean;
  canReorder: boolean;
  canTrack: boolean;
  canReview: boolean;
}

/**
 * Some API responses nest order items under `order_items` instead of `items`.
 * Normalizes to a consistent OrderItem[] for downstream use.
 */
export function getOrderItems(order: Order): OrderItem[] {
  const nested = (order as unknown as { order_items?: OrderItem[] }).order_items;
  return nested || order.items || [];
}

const REORDERABLE_STATUSES = new Set([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
]);

const TRACKABLE_STATUSES = new Set([
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
]);

/** Derives which dashboard quick actions are available given the recent orders. */
export function getQuickActionState(orders: Order[]): QuickActionState {
  const lastOrder = orders[0] ?? null;
  const hasOrders = orders.length > 0;

  const canReorder =
    lastOrder != null &&
    REORDERABLE_STATUSES.has(lastOrder.status) &&
    getOrderItems(lastOrder).length > 0;

  const canTrack = lastOrder != null && TRACKABLE_STATUSES.has(lastOrder.status);

  const canReview = orders.some((o) => o.status === 'delivered');

  return { lastOrder, hasOrders, canReorder, canTrack, canReview };
}