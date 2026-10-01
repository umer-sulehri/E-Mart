'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ShoppingCart, X, Plus, BarChart3, Trash2, Star, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { useHydrated } from '@/hooks/useHydrated';
import {
  useCompareStore,
  MAX_COMPARE_ITEMS,
  lockedCategoryId,
  remainingCompareSlots,
  type CompareItem,
} from '@/store/compareStore';
import { resolveGroupLabel } from '@/lib/compare-rules';
import { resolvePriceDisplay } from '@/lib/utils';
import { useCartStore } from '@/store';
import { tryParseJson } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import type { CartItem, Category, Product } from '@/types';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  /** Display name, from the product's primary category. */
  category: string;
  categoryId: string;
}

type Notice =
  | { tone: 'limit'; message: string }
  | { tone: 'mismatch'; message: string; product: SearchResult }
  | null;

/** The figure a picker result advertises: the sale price when there is one. */
function resultPrice(product: SearchResult): number {
  return resolvePriceDisplay(product.price, product.discountPrice).current;
}

export default function ComparePage({
  initialProductSlugs = [],
}: {
  initialProductSlugs?: string[];
}) {
  // The tray lives in sessionStorage, so the server render has no items and the
  // first client render would disagree with it. Gate the whole view on
  // hydration rather than letting React patch a mismatched table.
  const hydrated = useHydrated();

  const items = useCompareStore((s) => s.items);
  const removeItem = useCompareStore((s) => s.removeItem);
  const clearAll = useCompareStore((s) => s.clearAll);
  const addItemToCart = useCartStore((s) => s.addItem);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  // Transient and self-clearing. A fixed timeout avoids depending on an effect
  // that must observe a rising edge.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  /**
   * The tray holds a single category: the one its first saved product belongs to.
   * Every item in it is therefore comparable with every other, so `items` is the
   * comparison — no grouping or switching needed.
   */
  const comparing = items;
  const trayCategoryId = lockedCategoryId(items);
  const trayLabel = items[0] ? resolveGroupLabel(items[0]) : '';
  const trayRoom = remainingCompareSlots(items);
  const trayFull = trayRoom === 0;

  // Hydrate the tray from a deep link (?products=slug1,slug2) so shared links
  // work without requiring the local persisted store.
  useEffect(() => {
    if (initialProductSlugs.length === 0) return;
    const existing = useCompareStore.getState().items;
    const missing = initialProductSlugs.filter(
      (slug) => !existing.some((i) => i.slug === slug)
    );
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      // Fetched concurrently, so the slot budget is computed from the snapshot
      // taken above rather than from the mutating list. A deep link may name
      // products from several categories; the store refuses the ones that do not
      // match, so the budget only needs to cover the first category.
      const budget = remainingCompareSlots(existing);
      await Promise.all(
        missing.slice(0, budget).map(async (slug) => {
          try {
            const res = await fetch(`/api/v1/products/${encodeURIComponent(slug)}`);
            if (!res.ok) return;
            const json = await tryParseJson<{
              success: boolean;
              data?: {
                id: string;
                name: string;
                slug: string;
                price: number;
                discount_price?: number | null;
                rating?: number;
                review_count?: number;
                images?: string[];
                stock_quantity?: number;
                category_id?: string | null;
                category?: { id?: string; name: string };
                categories?: { id?: string; name: string }[];
                brand?: { name: string };
                brands?: { name: string }[];
              };
            }>(res);
            if (!json?.success || !json.data) return;
            const p = json.data;
            // Fall back to the oldest of the three category sources: an
            // explicit category, the first in the array, then the raw FK. A
            // product whose category still cannot be resolved keeps an empty id
            // and is saved under one "Uncategorised" label rather than dropped,
            // because losing a deep-linked product silently is worse than
            // labelling it vaguely. It then only compares with other products
            // of equally unknown category, which is the honest outcome.
            const categoryId =
              p.category?.id || p.categories?.[0]?.id || p.category_id || '';
            const item: CompareItem = {
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price,
              discountPrice: p.discount_price ?? undefined,
              rating: p.rating || 0,
              reviewCount: p.review_count || 0,
              image: p.images?.[0] || '/images/product-thumb-1.webp',
              category: p.category?.name || p.categories?.[0]?.name || '',
              categoryId,
              brand: p.brand?.name || p.brands?.[0]?.name || '',
              inStock: (p.stock_quantity ?? 0) > 0,
            };
            if (cancelled) return;
            // Concurrent fetches resolve out of order, so each is added
            // sequentially against the live list; the store enforces the caps.
            useCompareStore.getState().addItem(item);
          } catch {
            // Ignore individual fetch failures so a single bad slug never
            // blocks the rest of the deep-linked products.
          }
        })
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [initialProductSlugs]);

  const handleRemove = (productId: string) => {
    removeItem(productId);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // The tray holds one category, so the picker only offers that category.
      // Filtering server-side (not just hiding the mismatches afterwards) means
      // a search for a broad term returns a full page of comparable products
      // rather than a handful of disabled ones.
      const params = new URLSearchParams({
        search: searchQuery.trim(),
        limit: '8',
      });
      if (trayCategoryId) params.set('categoryId', trayCategoryId);
      const res = await fetch(`/api/v1/products?${params.toString()}`);
      if (!res.ok) return;
      const data = await tryParseJson<{
        data?: {
          id: string;
          name: string;
          slug: string;
          price: number;
          discount_price?: number;
          rating?: number;
          review_count?: number;
          images?: string[];
          category_id?: string | null;
          categories?: { id?: string; name: string }[];
        }[];
      }>(res);
      if (!data?.data) return;

      const savedIds = new Set(items.map((i) => i.id));
      const mapped: SearchResult[] = data.data
        // Already-saved products are dropped, so the list never offers an "add"
        // button that would only report a duplicate.
        .filter((p) => !savedIds.has(p.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          discountPrice: p.discount_price ?? undefined,
          rating: p.rating || 0,
          reviewCount: p.review_count || 0,
          image: p.images?.[0] || '/images/product-thumb-1.webp',
          category: p.categories?.[0]?.name || '',
          categoryId: p.categories?.[0]?.id || p.category_id || '',
        }));
      setSearchResults(mapped);
    } catch {
      // Leave the previous results in place rather than blanking the panel.
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToCompare = (product: SearchResult) => {
    const compareItem: CompareItem = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discountPrice: product.discountPrice,
      rating: product.rating,
      reviewCount: product.reviewCount,
      image: product.image,
      category: product.category,
      categoryId: product.categoryId,
      brand: '',
      inStock: true,
    };
    const decision = useCompareStore.getState().addItem(compareItem);

    if (decision.allowed) {
      setSearchResults((prev) => prev.filter((r) => r.id !== product.id));
      toast.success('Added to compare');
      return;
    }

    switch (decision.reason) {
      case 'category-mismatch':
        setNotice({
          tone: 'mismatch',
          message: `Your compare list is comparing ${decision.label} products. Only products from the same category can be compared — clear the list to start a new one.`,
          product,
        });
        break;
      case 'category-full':
        setNotice({
          tone: 'limit',
          message: `You can compare up to ${MAX_COMPARE_ITEMS} ${decision.label} products. Remove one to swap it.`,
        });
        break;
      case 'duplicate':
        setSearchResults((prev) => prev.filter((r) => r.id !== product.id));
        break;
    }
  };

  const handleAddToCart = (item: CompareItem) => {
    // The tray stores a snapshot, not a full product row, so the fields the
    // cart never reads (description, sku, brand entity) are left empty rather
    // than invented. Every field `CartItem` requires is present, so this needs
    // no type assertion.
    const now = new Date().toISOString();
    const category: Category = {
      id: item.categoryId,
      name: resolveGroupLabel(item),
      slug:
        item.category?.trim().toLowerCase().replace(/\s+/g, '-') ||
        `category-${item.categoryId}`,
      isActive: true,
      displayOrder: 0,
      createdAt: now,
      updatedAt: now,
    };
    const product: Product = {
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: '',
      price: item.price,
      discountPrice: item.discountPrice,
      stockQuantity: item.inStock ? 1 : 0,
      sku: '',
      category,
      categoryId: item.categoryId,
      rating: item.rating,
      reviewCount: item.reviewCount,
      isActive: true,
      isFeatured: false,
      isNew: false,
      images: item.image ? [item.image] : [],
      tags: item.brand ? [item.brand] : [],
      createdAt: now,
      updatedAt: now,
    };
    const unitPrice = item.discountPrice || item.price;
    const cartItem: CartItem = {
      id: `compare-${item.id}`,
      productId: item.id,
      product,
      unitPrice,
      quantity: 1,
      totalPrice: unitPrice,
      addedAt: now,
    };
    addItemToCart(cartItem);
    // Persist to the server cart when signed in; gracefully no-ops for guests.
    useCartStore.getState().addToServer(item.id, 1);
    toast.success(`${item.name} added to cart`);
  };

  if (!hydrated) {
    return (
      <div
        className="mx-auto max-w-6xl animate-pulse px-4 py-8"
        aria-busy="true"
        aria-label="Loading comparison"
      >
        <div className="mb-8 h-8 w-56 rounded bg-muted-100" />
        <div className="h-72 rounded-2xl bg-muted-100" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <BarChart3 size={40} className="text-primary" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-secondary-800">
          Compare Products
        </h1>
        <p className="mt-3 text-muted-500">
          Add products to compare their features side by side.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Plus size={16} aria-hidden="true" />
            Browse Products
          </Link>
          <p className="text-xs text-muted-400">
            You can compare up to {MAX_COMPARE_ITEMS} products from the same
            category. Products from a different category cannot be added to the
            same table.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-secondary-800">
            Compare Products
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-500">
            <span>
              Comparing {comparing.length} of {MAX_COMPARE_ITEMS} products
            </span>
            {/* The tray is locked to one category, so naming it is what tells the
                shopper why a product they can see elsewhere on the site cannot
                be added here. */}
            {trayLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <Tag size={12} aria-hidden="true" />
                Comparing in: {trayLabel}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {trayRoom > 0 && (
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              aria-expanded={showSearch}
              aria-controls="compare-search-panel"
              className="inline-flex items-center gap-2 rounded-xl border border-muted-200 bg-white px-4 py-2 text-sm font-semibold text-secondary-700 shadow-sm transition-colors hover:bg-muted-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Plus size={16} aria-hidden="true" />
              Add Product
            </button>
          )}
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-2 rounded-xl border border-danger/20 bg-white px-4 py-2 text-sm font-semibold text-danger shadow-sm transition-colors hover:bg-danger/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            <Trash2 size={16} aria-hidden="true" />
            Clear All
          </button>
        </div>
      </div>

      {showSearch && (
        <div
          id="compare-search-panel"
          className="mb-8 rounded-2xl border border-muted-100 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-1 text-sm font-semibold text-secondary-700">
            Add a {trayLabel || 'product'} to compare
          </h2>
          <p className="mb-4 text-xs text-muted-500">
            {trayLabel
              ? `Only ${trayLabel} products can join this table.`
              : 'The first product you add decides which category you can compare.'}
          </p>
          <div className="flex gap-3">
            {/* A placeholder is not an accessible name, and this input has no
                visible label. */}
            <label htmlFor="compare-search" className="sr-only">
              Search products to compare
            </label>
            <input
              id="compare-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by product name..."
              className="flex-1 rounded-xl border border-muted-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 ? (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {searchResults.map((product) => {
                const alreadySaved = items.some((i) => i.id === product.id);
                // The tray is locked to one category, so a result from anywhere
                // else is shown but cannot be added. Saying so up front is
                // better than a click that silently refuses.
                const matchesTray =
                  trayCategoryId === null ||
                  product.categoryId === trayCategoryId;

                return (
                  <li
                    key={product.id}
                    className="rounded-xl border border-muted-100 p-3 text-center"
                  >
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      width={80}
                      height={80}
                      className="mx-auto h-20 w-20 object-contain"
                    />
                    <p className="mt-2 line-clamp-2 text-xs font-medium text-secondary-700">
                      {product.name}
                    </p>
                    <p className="mt-1 text-xs font-bold text-primary">
                      Rs. {resultPrice(product).toLocaleString()}
                    </p>
                    {/* Positive styling is reserved for a result that can
                        actually join the table, so the pill reads as a state
                        rather than a decoration. */}
                    <p
                      className={
                        matchesTray && trayCategoryId !== null
                          ? 'mt-1.5 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary'
                          : 'mt-1.5 inline-flex rounded-full bg-muted-200 px-2 py-0.5 text-[10px] font-semibold text-muted-600'
                      }
                    >
                      {matchesTray
                        ? trayCategoryId === null
                          ? 'Sets the category'
                          : 'Same category'
                        : resolveGroupLabel(product)}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAddToCompare(product)}
                      disabled={alreadySaved || !matchesTray || trayFull}
                      aria-label={
                        alreadySaved
                          ? `${product.name} is already saved`
                          : !matchesTray
                            ? `${product.name} is in ${resolveGroupLabel(product)}, and your list is comparing ${trayLabel}`
                            : trayFull
                              ? `Your compare list is full, remove a product to add ${product.name}`
                              : `Add ${product.name} to compare`
                      }
                      className="mt-2 w-full rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:bg-muted-100 disabled:text-muted-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {alreadySaved
                        ? 'Saved'
                        : !matchesTray
                          ? 'Other category'
                          : trayFull
                            ? `${MAX_COMPARE_ITEMS} max`
                            : '+ Compare'}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            isSearching && (
              <p className="mt-4 text-xs text-muted-500">Searching&hellip;</p>
            )
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-muted-100 bg-white shadow-sm">
        <table className="w-full min-w-[640px] table-fixed">
          <caption className="sr-only">
            {`Comparing ${comparing.length} ${trayLabel} products side by side`}
          </caption>
          <colgroup>
            {/* `table-fixed` plus an explicit feature-column width is what makes
                the product columns equal width: with auto layout the widest
                product name sets every other column's width. The feature column
                is sticky so the row labels stay readable while the products
                scroll sideways on a phone. */}
            <col className="w-36 sm:w-44" />
            {comparing.map((item) => (
              <col key={item.id} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-muted-100">
              <th
                scope="col"
                className="sticky left-0 z-10 w-36 bg-white p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-500 sm:w-44"
              >
                Feature
              </th>
              {comparing.map((item) => (
                <th key={item.id} scope="col" className="p-4 text-center">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      aria-label={`Remove ${item.name} from compare`}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-muted-100 text-muted-500 transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      width={120}
                      height={120}
                      className="mx-auto h-24 w-24 object-contain"
                    />
                    <span className="mt-2 block text-xs font-medium text-secondary-700">
                      {item.name}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <ComparisonRow label="Name" comparing={comparing}>
              {(item) => (
                <Link
                  href={`/products/${item.slug}`}
                  className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {item.name}
                </Link>
              )}
            </ComparisonRow>

            <ComparisonRow label="Price" comparing={comparing} striped>
              {(item) => {
                const { current, original } = resolvePriceDisplay(
                  item.price,
                  item.discountPrice
                );
                return (
                  <div>
                    <span
                      className={
                        original !== null
                          ? 'text-sm font-bold text-danger'
                          : 'text-sm font-bold text-secondary-800'
                      }
                    >
                      Rs. {current.toLocaleString()}
                    </span>
                    {original !== null && (
                      <span className="ml-2 text-xs text-muted-400 line-through">
                        Rs. {original.toLocaleString()}
                      </span>
                    )}
                  </div>
                );
              }}
            </ComparisonRow>

            <ComparisonRow label="Rating" comparing={comparing}>
              {(item) => (
                <div className="flex items-center justify-center gap-1">
                  {item.rating > 0 ? (
                    <>
                      <Star
                        size={14}
                        className="fill-warning text-warning"
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium text-secondary-700">
                        {item.rating.toFixed(1)}
                      </span>
                      {item.reviewCount > 0 && (
                        <span className="text-xs text-muted-400">
                          ({item.reviewCount})
                        </span>
                      )}
                    </>
                  ) : (
                    // An empty star beside "N/A" read as a zero-star product
                    // rather than an unrated one, and the abbreviation meant
                    // nothing to a shopper.
                    <span className="text-sm text-muted-400">
                      No ratings yet
                    </span>
                  )}
                </div>
              )}
            </ComparisonRow>

            <ComparisonRow label="Category" comparing={comparing} striped>
              {(item) => (
                <span className="text-sm text-secondary-600">
                  {resolveGroupLabel(item)}
                </span>
              )}
            </ComparisonRow>

            <ComparisonRow label="Brand" comparing={comparing}>
              {(item) => (
                <span className="text-sm text-secondary-600">
                  {item.brand || 'Not specified'}
                </span>
              )}
            </ComparisonRow>

            <ComparisonRow label="Stock Status" comparing={comparing} striped>
              {(item) => (
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    item.inStock
                      ? 'bg-success/10 text-success'
                      : 'bg-danger/10 text-danger'
                  }`}
                >
                  {item.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              )}
            </ComparisonRow>

            <tr className="border-t border-muted-100">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-white p-4 text-left text-sm font-semibold text-secondary-700"
              >
                Action
              </th>
              {comparing.map((item) => (
                <td key={item.id} className="p-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.inStock}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <ShoppingCart size={14} aria-hidden="true" />
                    Add to Cart
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* A single product has nothing to be compared against, so say so rather
          than presenting a one-column table that looks broken. */}
      {comparing.length === 1 && (
        <p className="mt-4 text-center text-xs text-muted-500">
          Add another {trayLabel} product to see them side by side.
        </p>
      )}

      {/* The tray is capped and the user can see the table full, so this only
          reports the reason a click was refused rather than announcing a new
          state. */}
      {notice && (
        <div
          role="status"
          className="fixed left-1/2 z-[60] flex w-[min(90vw,32rem)] -translate-x-1/2 flex-col gap-3 rounded-xl bg-secondary-800 px-4 py-3 text-sm font-medium text-white shadow-lg bottom-[calc(72px+env(safe-area-inset-bottom))] lg:bottom-4"
        >
          <p>{notice.message}</p>
          {notice.tone === 'mismatch' && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  useCompareStore.getState().replaceWith({
                    id: notice.product.id,
                    name: notice.product.name,
                    slug: notice.product.slug,
                    price: notice.product.price,
                    discountPrice: notice.product.discountPrice,
                    rating: notice.product.rating,
                    reviewCount: notice.product.reviewCount,
                    image: notice.product.image,
                    category: notice.product.category,
                    categoryId: notice.product.categoryId,
                    brand: '',
                    inStock: true,
                  });
                  setSearchResults([]);
                  setNotice(null);
                  toast.success('Compare list cleared — now showing this product');
                }}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Clear &amp; add this instead
              </button>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="text-xs font-medium text-muted-200 underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Keep current list
              </button>
            </div>
          )}
        </div>
      )}

      {trayRoom > 0 && (
        <p className="mt-6 text-center text-xs text-muted-500">
          {trayRoom} more {trayLabel} product{trayRoom === 1 ? '' : 's'} can be
          added to this table.
        </p>
      )}
    </div>
  );
}

/**
 * One labelled row of the comparison table.
 *
 * Extracted so adding a specification row is a single entry rather than another
 * nested ternary inside a 200-line `<tbody>`.
 */
function ComparisonRow({
  label,
  comparing,
  striped = false,
  children,
}: {
  label: string;
  comparing: readonly CompareItem[];
  striped?: boolean;
  children: (item: CompareItem) => ReactNode;
}) {
  // Matches the row background exactly: a sticky cell that is transparent lets
  // the product columns show through it as they slide underneath.
  const rowClass = striped ? 'bg-muted-50/50' : 'bg-white';
  return (
    <tr className={striped ? 'bg-muted-50/50' : undefined}>
      <th
        scope="row"
        className={`sticky left-0 z-10 p-4 text-left text-sm font-semibold text-secondary-700 ${rowClass}`}
      >
        {label}
      </th>
      {comparing.map((item) => (
        <td key={item.id} className="p-4 text-center">
          {children(item)}
        </td>
      ))}
    </tr>
  );
}
