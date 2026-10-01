import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface UseAddToWishlistOptions {
  initial?: boolean;
  /** When true, fetch the server wishlist on mount to seed `isWishlisted`. */
  isAuthenticated?: boolean;
}

export function useAddToWishlist(
  productId: string,
  productName: string,
  { initial = false, isAuthenticated = false }: UseAddToWishlistOptions = {}
) {
  const [isWishlisted, setIsWishlisted] = useState(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated || !productId) return;

    (async () => {
      try {
        // One-row membership probe. Fetching the whole wishlist per card meant a
        // grid fired a full list request for every product, and started silently
        // reporting "not saved" for anyone past the page limit.
        const res = await fetch(
          `/api/v1/wishlist?productId=${encodeURIComponent(productId)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.success) setIsWishlisted(Boolean(data.data?.saved));
      } catch {
        // ignore – keep current state
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, productId]);

  const toggleWishlist = useCallback(async () => {
    if (loading || !productId) return;

    const newState = !isWishlisted;
    setIsWishlisted(newState);
    setLoading(true);

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

      toast.success(
        newState
          ? `${productName} added to wishlist!`
          : `${productName} removed from wishlist`
      );
    } catch {
      setIsWishlisted(!newState);
      toast.error('Please sign in to manage your wishlist');
    } finally {
      setLoading(false);
    }
  }, [loading, isWishlisted, productId, productName]);

  return { isWishlisted, toggleWishlist, wishlistLoading: loading };
}
