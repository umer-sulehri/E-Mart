import { apiFetch } from '@/lib/api/client';

/** Mirror a local wishlist add to the server (no-op for guests). */
export function syncWishlistAdd(productId: string): void {
  void apiFetch('/wishlist', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  }).catch(() => {});
}

/** Mirror a local wishlist removal to the server (no-op for guests). */
export function syncWishlistRemove(productId: string): void {
  void apiFetch(`/wishlist/${productId}`, { method: 'DELETE' }).catch(() => {});
}

/**
 * Pull the server wishlist into the local store after login/page load.
 * Guests get a 401, which is ignored — the local store stays authoritative.
 */
export async function hydrateWishlistFromServer(): Promise<void> {
  try {
    const data = await apiFetch<{ items: { id: string }[] }>('/wishlist');
    const { useWishlistStore } = await import('./wishlistStore');
    const current = useWishlistStore.getState().items;
    const known = new Set(current.map((i) => i.productId));
    const merged = [...current];
    for (const product of data.items) {
      if (!known.has(product.id)) {
        merged.push({ productId: product.id, addedAt: new Date().toISOString() });
      }
    }
    if (merged.length !== current.length) {
      useWishlistStore.setState({ items: merged });
    }
  } catch {
    // Not signed in or offline — keep local-only wishlist.
  }
}
