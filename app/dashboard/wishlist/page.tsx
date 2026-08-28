'use client';

import { useEffect, useState } from 'react';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { useRouter } from 'next/navigation';
import { X, ShoppingCart, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import type { Product } from '@/types';

interface WishlistEntry {
  id: string;
  productId: string;
  product: Product | null;
  createdAt: string;
}

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingCartId, setAddingCartId] = useState<string | null>(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/wishlist');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.success) {
          setItems(data.data || []);
        } else {
          toast.error(data.error || 'Failed to load wishlist');
        }
      } catch {
        toast.error('Failed to load wishlist');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [router, isAuthenticated]);

  const removeItem = async (productId: string) => {
    try {
      setRemovingId(productId);
      const res = await fetch(`/api/v1/wishlist/${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((item) => item.productId !== productId));
        toast.success('Removed from wishlist');
      } else {
        toast.error(data.error || 'Failed to remove item');
      }
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setRemovingId(null);
    }
  };

  const moveToCart = async (productId: string) => {
    try {
      setAddingCartId(productId);
      const res = await fetch('/api/v1/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        await removeItem(productId);
        toast.success('Added to cart');
      } else {
        toast.error(data.error || 'Failed to add to cart');
      }
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAddingCartId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width={150} height={28} />
          <Skeleton variant="text" width={80} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
              <Skeleton variant="rectangle" height={160} className="mb-4 w-full" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="40%" className="mt-2" />
              <Skeleton variant="rectangle" height={32} className="mt-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-secondary-800">My Wishlist</h2>
        <p className="text-sm text-muted-500">{items.length} items</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <Heart className="mx-auto h-12 w-12 text-muted-300" />
          <p className="mt-4 text-lg font-semibold text-secondary-800">
            Your wishlist is empty
          </p>
          <p className="mt-1 text-sm text-muted-500">
            Save items you love for later.
          </p>
          <Button variant="primary" className="mt-4">
            Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((entry) => {
            const product = entry.product;
            if (!product) return null;
            const price = product.discountPrice ?? product.price;
            const discount = product.discountPrice
              ? calculateDiscount(product.price, product.discountPrice)
              : 0;
            const inStock = product.stockQuantity > 0 && product.isActive;
            const imageUrl = product.images?.[0] || '/images/placeholder.png';
            const isRemoving = removingId === entry.productId;
            const isAdding = addingCartId === entry.productId;

            return (
              <div
                key={entry.id}
                className="group relative rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() => removeItem(entry.productId)}
                  disabled={isRemoving}
                  className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-muted-400 shadow-sm transition-colors hover:bg-danger hover:text-white disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="relative mx-auto mb-4 flex h-40 items-center justify-center overflow-hidden rounded-lg bg-muted-50">
                  <ImageWithFallback
                    src={imageUrl}
                    alt={product.name}
                    width={160}
                    height={160}
                    className="object-contain"
                  />
                </div>

                <h3 className="truncate text-sm font-medium text-secondary-800">
                  {product.name}
                </h3>

                <div className="mt-2 flex items-center gap-2">
                  {product.discountPrice ? (
                    <>
                      <del className="text-xs text-muted-500">
                        {formatPrice(product.price)}
                      </del>
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(product.discountPrice)}
                      </span>
                      <span className="rounded border border-muted-200 bg-white px-1 py-0.5 text-[10px] text-muted-600">
                        {discount}% OFF
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-secondary-800">
                      {formatPrice(price)}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    disabled={!inStock || isAdding}
                    loading={isAdding}
                    onClick={() => moveToCart(entry.productId)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {inStock ? 'Move to Cart' : 'Out of Stock'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
