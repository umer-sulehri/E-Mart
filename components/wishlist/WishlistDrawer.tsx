'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X, Trash2, Heart, Loader2, LogIn } from 'lucide-react';
import { useWishlistStore, toWishlistItem } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { useHydrated } from '@/hooks/useHydrated';
import { useBodyScrollLock, useEscapeKey } from '@/hooks/useOverlay';
import { formatPrice, resolvePriceDisplay, cn } from '@/lib/utils';
import { tryParseJson } from '@/lib/api';
import { WISHLIST_DRAWER_LIMIT } from '@/lib/constants';
import Button from '@/components/ui/Button';
import ImageWithFallback from '@/components/ui/ImageWithFallback';

/** `toWishlistItem` drops a product that was deleted after being saved. */
function isWishlistItem(
  item: ReturnType<typeof toWishlistItem>
): item is NonNullable<ReturnType<typeof toWishlistItem>> {
  return item !== null;
}

/**
 * The wishlist as a right-hand side drawer, mirroring `CartSidebar`.
 *
 * It is a preview, not a replacement for `/wishlist`: at most
 * {@link WISHLIST_DRAWER_LIMIT} products are shown, and "See more" hands off to
 * the full page. That keeps the drawer inside one thumb-reach on a phone while
 * the header heart can still act as a single tap target instead of a navigation
 * step away from every product page.
 *
 * The rows live in `useWishlistStore`, not in local state, so `removeItem`
 * removes the row the shopper tapped. The store's summary only knows ids (see
 * `hydrate`); the full rows are written in through `setItems` when the drawer
 * opens, because a wishlist's products carry image and price data that would
 * make the store a second cache of nothing useful if it were fetched on mount.
 */
export default function WishlistDrawer() {
  const isOpen = useWishlistStore((s) => s.isOpen);
  const close = useWishlistStore((s) => s.close);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const setItems = useWishlistStore((s) => s.setItems);
  const count = useWishlistStore((s) => s.count);
  const hydrate = useWishlistStore((s) => s.hydrate);
  const items = useWishlistStore((s) => s.items);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useHydrated();

  const [loading, setLoading] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Keeps the drawer mounted off-canvas so the slide can animate, while making
  // it inert when closed so its links are not in the tab order.
  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;
    if (isOpen) el.removeAttribute('inert');
    else el.setAttribute('inert', '');
  }, [isOpen]);

  useBodyScrollLock(isOpen);
  useEscapeKey(isOpen, close);

  // Seeds the id set for the header badge. Only once per session — the store
  // guards on `status === 'idle'`, so every card mounting is a no-op.
  useEffect(() => {
    if (hydrated && isAuthenticated) hydrate();
  }, [hydrated, isAuthenticated, hydrate]);

  // Sign-out must not leave the previous shopper's items on screen.
  useEffect(() => {
    if (hydrated && !isAuthenticated) useWishlistStore.getState().reset();
  }, [hydrated, isAuthenticated]);

  const loadItems = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/wishlist?limit=${WISHLIST_DRAWER_LIMIT}`
      );
      const json = await tryParseJson<{
        success: boolean;
        data?: Parameters<typeof toWishlistItem>[0][];
      }>(res);
      if (json?.success && Array.isArray(json.data)) {
        setItems(json.data.map(toWishlistItem).filter(isWishlistItem));
      }
    } catch {
      // Leave the previous list in place; the drawer is a preview, so a stale
      // row beats an empty panel with no explanation.
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, setItems]);

  // Fetch on open, not on mount: a shopper who never opens the drawer should
  // not pay for the list request.
  useEffect(() => {
    if (isOpen) loadItems();
  }, [isOpen, loadItems]);

  const handleRemove = useCallback(
    async (productId: string) => {
      // Optimistic, same contract as the product-card heart: the row leaves the
      // drawer immediately and comes back if the server refuses.
      removeItem(productId);
      try {
        const res = await fetch(`/api/v1/wishlist/${productId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('failed');
      } catch {
        await loadItems();
      }
    },
    [removeItem, loadItems]
  );

  const handleClose = useCallback(() => close(), [close]);

  const hasItems = items.length > 0;
  const hiddenCount = Math.max(0, count - items.length);

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Wishlist"
        aria-hidden={!isOpen}
        className={cn(
          // `100dvh`, not `100vh`: on a phone with the URL bar showing, `100vh`
          // is taller than the visible area and the footer buttons end up under
          // the browser chrome.
          'fixed right-0 top-0 z-[70] flex h-[100dvh] w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-muted-200 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="font-heading text-lg font-bold text-secondary-800">
              Wishlist
            </h2>
            {hydrated && count > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="-mr-2 shrink-0 rounded-lg p-2.5 text-muted-500 transition-colors hover:bg-muted-50 hover:text-secondary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close wishlist"
          >
            <X size={20} className="shrink-0" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted-100">
              <Heart size={28} className="shrink-0 text-muted-400" />
            </div>
            <p className="text-sm font-medium text-secondary-800">
              Sign in to see your wishlist
            </p>
            <Link href="/login" onClick={handleClose} className="w-full max-w-[220px]">
              <Button variant="primary" className="w-full">
                <LogIn size={16} className="shrink-0" />
                Login
              </Button>
            </Link>
          </div>
        ) : loading && !hasItems ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : !hasItems ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted-100">
              <Heart size={28} className="shrink-0 text-muted-400" />
            </div>
            <p className="text-sm font-medium text-secondary-800">
              Your wishlist is empty
            </p>
            <Button variant="primary" onClick={handleClose}>
              Browse Products
            </Button>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
              <ul className="divide-y divide-muted-100">
                {items.map((item) => {
                  const { current, original } = resolvePriceDisplay(
                    item.price,
                    item.discountPrice
                  );
                  return (
                    <li key={item.id} className="flex gap-3 py-4">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={handleClose}
                        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted-50"
                      >
                        <ImageWithFallback
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-contain p-1"
                        />
                        {!item.inStock && (
                          <span className="absolute inset-x-0 bottom-0 bg-danger/90 py-0.5 text-center text-[10px] font-semibold text-white">
                            Out of stock
                          </span>
                        )}
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={handleClose}
                          className="line-clamp-2 text-sm font-medium text-secondary-800 transition-colors hover:text-primary"
                        >
                          {item.name}
                        </Link>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-primary">
                            {formatPrice(current)}
                          </span>
                          {original !== null && (
                            <del className="text-xs text-muted-500">
                              {formatPrice(original)}
                            </del>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemove(item.productId)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-lg text-muted-400 transition-colors hover:bg-danger-50 hover:text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={`Remove ${item.name} from wishlist`}
                      >
                        <Trash2 size={16} className="shrink-0" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="shrink-0 border-t border-muted-200 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6">
              {hiddenCount > 0 && (
                <p className="mb-3 text-center text-xs text-muted-500">
                  Showing {items.length} of {count} saved products
                </p>
              )}
              <Link href="/wishlist" onClick={handleClose}>
                <Button variant="primary" className="w-full" size="lg">
                  <Heart size={16} className="shrink-0" />
                  See more
                </Button>
              </Link>
              <button
                onClick={handleClose}
                className="mt-3 w-full text-center text-sm font-medium text-secondary-700 transition-colors hover:text-primary"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}