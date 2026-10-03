import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useWishlistStore, toWishlistItem } from '@/store/wishlistStore';

interface UseAddToWishlistOptions {
  initial?: boolean;
  /** When true, seed `isWishlisted` from the shared store. */
  isAuthenticated?: boolean;
}

/**
 * Drives one product card's heart, backed by the shared wishlist store.
 *
 * The heart used to own a per-card `GET /api/v1/wishlist?productId=` probe on
 * mount. On a 24-card grid that was 24 requests to answer one question, and the
 * header could not show a count at all. State now lives in `useWishlistStore`,
 * hydrated once by the drawer's mount effect, so this hook is a thin
 * optimistic wrapper over it.
 *
 * Optimistic on purpose: the heart fills the instant it is tapped, and the
 * server response only has to confirm. A failure rolls the store back and says
 * why, which is the same contract the previous implementation had.
 */
export function useAddToWishlist(
  productId: string,
  productName: string,
  { initial = false, isAuthenticated = false }: UseAddToWishlistOptions = {}
) {
  // Subscribing to the whole record would re-render this card on every other
  // card's toggle; the computed boolean keeps the selector to one primitive.
  const isWishlisted = useWishlistStore(
    (s) => (productId ? s.ids[productId] === true : false)
  );
  const markSaved = useWishlistStore((s) => s.markSaved);
  const markRemoved = useWishlistStore((s) => s.markRemoved);
  const addItem = useWishlistStore((s) => s.addItem);
  const hydrate = useWishlistStore((s) => s.hydrate);

  // Before the store has loaded, `isWishlisted` is false for every product. The
  // caller's `initial` is the only signal available in that window, so fall back
  // to it rather than flashing an unsaved heart for a saved product.
  const [settled, setSettled] = useState(false);
  useEffect(() => setSettled(true), []);

  const shown = settled ? isWishlisted : initial;
  const [loading, setLoading] = useState(false);

  // A guest has no server wishlist to fetch; skip the request entirely rather
  // than letting the drawer fire a guaranteed 401.
  useEffect(() => {
    if (isAuthenticated) hydrate();
  }, [isAuthenticated, hydrate]);

  const toggleWishlist = useCallback(async () => {
    if (loading || !productId) return;

    const newState = !isWishlisted;
    setLoading(true);
    if (newState) markSaved(productId);
    else markRemoved(productId);

    try {
      const res = await fetch(
        newState ? '/api/v1/wishlist' : `/api/v1/wishlist/${productId}`,
        {
          method: newState ? 'POST' : 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: newState ? JSON.stringify({ productId }) : undefined,
        }
      );

      if (!res.ok) throw new Error('Wishlist request failed');

      // The POST echoes the created row joined to its product, so the drawer
      // can show the new item without a second list request.
      if (newState) {
        const json = (await res.json().catch(() => null)) as {
          data?: Parameters<typeof toWishlistItem>[0];
        } | null;
        const item = json?.data ? toWishlistItem(json.data) : null;
        if (item) addItem(item);
      }

      toast.success(
        newState
          ? `${productName} added to wishlist!`
          : `${productName} removed from wishlist`
      );
    } catch {
      if (newState) markRemoved(productId);
      else markSaved(productId);
      toast.error('Please sign in to manage your wishlist');
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    isWishlisted,
    productId,
    productName,
    markSaved,
    markRemoved,
    addItem,
  ]);

  return { isWishlisted: shown, toggleWishlist, wishlistLoading: loading };
}