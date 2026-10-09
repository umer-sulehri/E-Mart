'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Heart,
  ShoppingCart,
  Trash2,
  Loader2,
  LogIn,
} from 'lucide-react';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import ShareWishlist from '@/components/wishlist/ShareWishlist';
import { useWishlistStore, toWishlistItem } from '@/store/wishlistStore';
import { PAGE_SIZE } from '@/lib/pagination';
import { usePageParam } from '@/hooks/usePageParam';
import { formatPrice, resolvePriceDisplay } from '@/lib/utils';
import { tryParseJson } from '@/lib/api';
import type { WishlistPreviewItem } from '@/types';

interface WishlistMeta {
  totalItems: number;
  totalPages: number;
}

export default function WishlistPage() {
  // `usePageParam` reads `useSearchParams`, which must sit behind Suspense.
  return (
    <Suspense>
      <WishlistContent />
    </Suspense>
  );
}

function WishlistContent() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistPreviewItem[]>([]);
  const [meta, setMeta] = useState<WishlistMeta>({ totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const { page, setPage } = usePageParam();
  // The drawer and every product card mutate the wishlist through this store.
  // Watching `revision` here means a row deleted in the drawer disappears from
  // the full page too, without either component owning the other's list.
  const revision = useWishlistStore((state) => state.revision);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/v1/wishlist?page=${page}&limit=${PAGE_SIZE}`
      );
      const json = await tryParseJson<{
        success: boolean;
        data?: Parameters<typeof toWishlistItem>[0][];
        meta?: WishlistMeta;
      }>(res);

      if (json?.success && Array.isArray(json.data)) {
        // Rows whose product has since been deleted or deactivated join back as
        // null and are dropped rather than rendered as a blank card.
        const rows = json.data
          .map((row) => toWishlistItem(row))
          .filter((item): item is WishlistPreviewItem => item !== null);
        setItems(rows);

        const pages = json.meta?.totalPages ?? 1;
        setMeta({ totalPages: pages, totalItems: json.meta?.totalItems ?? 0 });
        if (page > pages) {
          setPage(pages);
        }
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, setPage]);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const res = await fetch('/api/v1/auth/me');
        const json = await tryParseJson<{ success: boolean; data?: unknown }>(res);
        if (cancelled) return;
        if (json?.success && json.data) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated !== true) return;
    fetchWishlist();
  }, [isAuthenticated, fetchWishlist, revision]);

  const handleRemove = async (productId: string) => {
    // Routed through the store so the header badge and the drawer agree without
    // this page having to know they exist. The effect above refetches.
    useWishlistStore.getState().removeItem(productId);
    setItems((prev) => prev.filter((item) => item.productId !== productId));
    setMeta((prev) => ({
      totalItems: Math.max(0, prev.totalItems - 1),
      totalPages: Math.max(1, Math.ceil(Math.max(0, prev.totalItems - 1) / PAGE_SIZE)),
    }));

    try {
      await fetch(`/api/v1/wishlist/${productId}`, { method: 'DELETE' });
    } catch {
      // The refetch triggered by the revision bump restores the truth.
    }
  };

  const handleMoveToCart = async (item: WishlistPreviewItem) => {
    try {
      const res = await fetch('/api/v1/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: item.productId, quantity: 1 }),
      });
      const data = await tryParseJson<{ success: boolean }>(res);
      if (res.ok && data?.success) {
        useWishlistStore.getState().removeItem(item.productId);
        await fetch(`/api/v1/wishlist/${item.productId}`, {
          method: 'DELETE',
        }).catch(() => {});
      }
    } catch {
      // fall through to the cart either way
    }
    router.push('/cart');
  };

  const hero = (
    <section className="relative bg-secondary-800 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
          My Wishlist
        </h1>
        <nav aria-label="Breadcrumb" className="mt-3 flex items-center gap-2 text-sm text-white/70">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
          <span className="text-primary">Wishlist</span>
        </nav>
      </div>
    </section>
  );

  // Auth check loading
  if (isAuthenticated === null) {
    return (
      <>
        {hero}
        <section className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" aria-label="Loading" />
        </section>
      </>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <>
        {hero}
        <section className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted-100">
            <Heart size={40} className="text-muted-400" aria-hidden="true" />
          </div>
          <h2 className="mb-2 font-heading text-xl font-bold text-secondary-800">
            Login to view your wishlist
          </h2>
          <p className="mb-6 max-w-sm text-sm text-muted-500">
            Save your favorite products to your wishlist and access them anytime.
          </p>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="primary" size="lg">
                <LogIn size={16} aria-hidden="true" />
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg">
                Create Account
              </Button>
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {hero}

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white p-5 shadow-sm">
                  <div className="h-48 rounded-xl bg-muted-100" />
                  <div className="mt-4 h-5 w-3/4 rounded bg-muted-100" />
                  <div className="mt-2 h-4 w-1/3 rounded bg-muted-100" />
                  <div className="mt-4 flex gap-2">
                    <div className="h-10 flex-1 rounded-lg bg-muted-100" />
                    <div className="h-10 w-10 rounded-lg bg-muted-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : meta.totalItems === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted-100">
                <Heart size={40} className="text-muted-400" aria-hidden="true" />
              </div>
              <h2 className="mb-2 font-heading text-xl font-bold text-secondary-800">
                Your wishlist is empty
              </h2>
              <p className="mb-6 max-w-sm text-sm text-muted-500">
                Browse our products and add your favorites to the wishlist.
              </p>
              <Link href="/products">
                <Button variant="primary" size="lg">
                  <ShoppingCart size={16} aria-hidden="true" />
                  Browse Products
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                {/* Counted from `meta`, not `items.length` — the grid shows one
                    page, so the header used to under-report on longer lists. */}
                <p className="text-sm text-muted-500">
                  You have{' '}
                  <span className="font-medium text-secondary-800">
                    {meta.totalItems}
                  </span>{' '}
                  {meta.totalItems === 1 ? 'item' : 'items'} in your wishlist
                </p>
                <ShareWishlist />
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => {
                  const { current, original } = resolvePriceDisplay(
                    item.price,
                    item.discountPrice
                  );
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <Link
                        href={`/products/${item.slug}`}
                        className="relative block h-48 overflow-hidden rounded-xl bg-muted-50"
                      >
                        <ImageWithFallback
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain p-2"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        {!item.inStock && (
                          <span className="absolute left-2 top-2 rounded-full bg-danger px-3 py-1 text-xs font-semibold text-white">
                            Out of Stock
                          </span>
                        )}
                      </Link>

                      <div className="mt-4">
                        <Link
                          href={`/products/${item.slug}`}
                          className="font-heading text-base font-bold text-secondary-800 hover:text-primary transition-colors"
                        >
                          {item.name}
                        </Link>

                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-lg font-bold text-primary">
                            {formatPrice(current)}
                          </span>
                          {original !== null && (
                            <span className="text-sm text-muted-400 line-through">
                              {formatPrice(original)}
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            disabled={!item.inStock}
                            onClick={() => handleMoveToCart(item)}
                          >
                            <ShoppingCart size={14} aria-hidden="true" />
                            Move to Cart
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Remove ${item.name} from wishlist`}
                            onClick={() => handleRemove(item.productId)}
                          >
                            <Trash2 size={14} className="text-danger" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Pagination
                currentPage={page}
                totalPages={meta.totalPages}
                totalItems={meta.totalItems}
                itemsPerPage={PAGE_SIZE}
                itemLabel="wishlist items"
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}