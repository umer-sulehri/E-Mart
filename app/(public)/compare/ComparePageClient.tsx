'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ShoppingCart, X, Plus, BarChart3, Trash2, Star, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import CompareGroupRail from '@/components/compare/CompareGroupRail';
import { useHydrated } from '@/hooks/useHydrated';
import {
  useCompareStore,
  MAX_COMPARE_ITEMS,
  MAX_SAVED_COMPARE_ITEMS,
  remainingTraySlots,
  type CompareItem,
} from '@/store/compareStore';
import {
  groupItemsByCategory,
  resolveActiveGroup,
  resolveGroupLabel,
} from '@/lib/compare-rules';
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

type Notice = { tone: 'limit' | 'tray'; message: string } | null;

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
  const activeCategoryId = useCompareStore((s) => s.activeCategoryId);
  const removeItem = useCompareStore((s) => s.removeItem);
  const clearAll = useCompareStore((s) => s.clearAll);
  const setActiveCategory = useCompareStore((s) => s.setActiveCategory);
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
   * The tray is partitioned by category. Only the active group is ever
   * compared — the rest wait in the rail below it.
   */
  const groups = useMemo(() => groupItemsByCategory(items), [items]);
  const activeGroup = useMemo(
    () => resolveActiveGroup(groups, activeCategoryId),
    [groups, activeCategoryId]
  );
  const comparing = activeGroup?.items ?? [];
  const trayRoom = remainingTraySlots(items.length);
  const roomInActiveGroup = Math.max(0, MAX_COMPARE_ITEMS - comparing.length);

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
      // taken above rather than from the mutating list. A deep link may span
      // categories; the tray now holds those in separate groups, so the budget
      // is the tray's own cap rather than a per-category one.
      const budget = remainingTraySlots(existing.length);
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
            // product whose category still cannot be resolved is saved under
            // the uncategorised group rather than dropped, because losing a
            // deep-linked product silently is worse than labelling it vaguely.
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

  const handleActivateGroup = (categoryId: string) => {
    setActiveCategory(categoryId);
    const group = groups.find((g) => g.categoryId === categoryId);
    if (group) {
      trackEvent({
        action: 'compare_group_switch',
        category: 'product',
        label: group.label,
      });
      toast.success(`Comparing ${group.items.length} ${group.label} products`);
    }
  };

  const handleRemove = (productId: string) => {
    removeItem(productId);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/v1/products?search=${encodeURIComponent(searchQuery)}&limit=8`
      );
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

      const mapped: SearchResult[] = data.data.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        discountPrice: p.discount_price,
        rating: p.rating || 0,
        reviewCount: p.review_count || 0,
        image: p.images?.[0] || '/images/product-thumb-1.webp',
        category: p.categories?.[0]?.name || '',
        categoryId: p.categories?.[0]?.id || p.category_id || '',
      }));
      // Already-saved products are dropped so the list never offers an "add"
      // button that would report a duplicate.
      setSearchResults((prev) => [
        ...mapped.filter((m) => !prev.some((saved) => saved.id === m.id)),
      ]);
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
      toast.success(
        decision.isNewGroup
          ? `Saved to compare · ${decision.groupLabel}`
          : 'Added to compare'
      );
      return;
    }

    switch (decision.reason) {
      case 'category-full':
        setNotice({
          tone: 'limit',
          message: `You can compare up to ${MAX_COMPARE_ITEMS} ${decision.label} products. Remove one to swap it.`,
        });
        break;
      case 'tray-full':
        setNotice({
          tone: 'tray',
          message: `Your compare list is full (${MAX_SAVED_COMPARE_ITEMS}). Remove a product to add another.`,
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
            category, and save up to {MAX_SAVED_COMPARE_ITEMS} in total.
          </p>
        </div>
      </div>
    );
  }

  const activeLabel = activeGroup?.label ?? '';
  const otherGroups = groups.filter(
    (group) => group.categoryId !== activeGroup?.categoryId
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-secondary-800">
            Compare Products
          </h1>
          <p className="mt-1 text-sm text-muted-500">
            Comparing {comparing.length} of {MAX_COMPARE_ITEMS} products
            {activeLabel && <> in {activeLabel}</>}
            {otherGroups.length > 0 && (
              <>
                {' '}
                &middot; {items.length} saved across {groups.length} categories
              </>
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
          <h2 className="mb-4 text-sm font-semibold text-secondary-700">
            Search Products to Compare
          </h2>
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
                const landsInActiveGroup =
                  !!activeGroup && product.categoryId === activeGroup.categoryId;
                const savedSlots = items.filter(
                  (i) => i.categoryId === product.categoryId
                ).length;
                const groupFull = savedSlots >= MAX_COMPARE_ITEMS;

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
                      Rs. {(product.discountPrice || product.price).toLocaleString()}
                    </p>
                    {landsInActiveGroup ? (
                      <p className="mt-1.5 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Same category
                      </p>
                    ) : (
                      <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-muted-200 px-2 py-0.5 text-[10px] font-semibold text-muted-600">
                        <Layers size={9} aria-hidden="true" />
                        Saves to {resolveGroupLabel(product)}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAddToCompare(product)}
                      disabled={alreadySaved || groupFull}
                      aria-label={
                        alreadySaved
                          ? `${product.name} is already saved`
                          : `Add ${product.name} to compare`
                      }
                      className="mt-2 w-full rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:bg-muted-100 disabled:text-muted-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {alreadySaved
                        ? 'Saved'
                        : groupFull
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

      {otherGroups.length > 0 && (
        <CompareGroupRail
          groups={groups}
          activeCategoryId={activeGroup?.categoryId ?? ''}
          totalSaved={items.length}
          onActivate={handleActivateGroup}
          onRemove={handleRemove}
        />
      )}

      <div className="overflow-x-auto rounded-2xl border border-muted-100 bg-white shadow-sm">
        <table className="w-full min-w-[600px]">
          <caption className="sr-only">
            {`Comparing ${comparing.length} ${activeLabel} products side by side`}
          </caption>
          <thead>
            <tr className="border-b border-muted-100">
              <th
                scope="col"
                className="w-40 p-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-500"
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
              {(item) =>
                item.discountPrice ? (
                  <div>
                    <span className="text-sm font-bold text-danger">
                      Rs. {item.discountPrice.toLocaleString()}
                    </span>
                    <span className="ml-2 text-xs text-muted-400 line-through">
                      Rs. {item.price.toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-secondary-800">
                    Rs. {item.price.toLocaleString()}
                  </span>
                )
              }
            </ComparisonRow>

            <ComparisonRow label="Rating" comparing={comparing}>
              {(item) => (
                <div className="flex items-center justify-center gap-1">
                  <Star
                    size={14}
                    className="fill-warning text-warning"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-secondary-700">
                    {item.rating > 0 ? item.rating.toFixed(1) : 'N/A'}
                  </span>
                  {item.reviewCount > 0 && (
                    <span className="text-xs text-muted-400">
                      ({item.reviewCount})
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
                  {item.brand || 'N/A'}
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
                className="p-4 text-left text-sm font-semibold text-secondary-700"
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

      {/* A single-product group has nothing to compare, so say so rather than
          presenting a one-column table that looks broken. */}
      {comparing.length === 1 && (
        <p className="mt-4 text-center text-xs text-muted-500">
          Add another {activeLabel} product to see them side by side.
        </p>
      )}

      {/* Announced politely rather than as an alert: it reports a state the user
          can already see on the page. */}
      {notice && (
        <p
          role="status"
          className="fixed left-1/2 z-[60] w-[min(90vw,28rem)] -translate-x-1/2 rounded-xl bg-secondary-800 px-4 py-3 text-center text-sm font-medium text-white shadow-lg bottom-[calc(72px+env(safe-area-inset-bottom))] lg:bottom-4"
        >
          {notice.message}
        </p>
      )}

      {/* Keyboard users need a way back to the saved groups once the table has
          pushed the rail off screen. */}
      {otherGroups.length > 0 && (
        <p className="mt-6 text-center text-xs text-muted-500">
          {roomInActiveGroup} more {activeLabel} product
          {roomInActiveGroup === 1 ? '' : 's'} can be added to this table.{' '}
          <a
            href="#compare-rail-heading"
            className="font-medium text-primary underline underline-offset-2"
          >
            Back to saved categories
          </a>
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
  return (
    <tr className={striped ? 'bg-muted-50/50' : undefined}>
      <th
        scope="row"
        className="p-4 text-left text-sm font-semibold text-secondary-700"
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
