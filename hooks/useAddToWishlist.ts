import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';

export function useAddToWishlist(
  productId: string,
  productName: string,
  initial = false
) {
  const [isWishlisted, setIsWishlisted] = useState(initial);
  const [loading, setLoading] = useState(false);

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
