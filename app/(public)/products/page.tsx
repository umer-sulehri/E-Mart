'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { ProductFilters } from '@/lib/types';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StarIcon, CloseIcon, SearchIcon } from '@/components/icons';

const ITEMS_PER_PAGE = 20;

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

const PRICE_RANGES = [
  { label: 'All Prices', min: undefined, max: undefined },
  { label: 'Under Rs 500', min: undefined, max: 500 },
  { label: 'Rs 500 - Rs 1,000', min: 500, max: 1000 },
  { label: 'Rs 1,000 - Rs 2,000', min: 1000, max: 2000 },
  { label: 'Over Rs 2,000', min: 2000, max: undefined },
];

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8"><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (<Card key={i} className="overflow-hidden animate-pulse"><div className="aspect-[4/3] bg-surface-alt" /><div className="p-3 space-y-2"><div className="h-4 bg-surface-alt rounded w-3/4" /></div></Card>))}
    </div></div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
  const [sort, setSort] = useState('popularity');
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [customMin, setCustomMin] = useState('');
  const [customMax, setCustomMax] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sellerId, setSellerId] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Keep local filter state in sync when the URL changes (e.g. back/forward navigation).
  const [syncedParams, setSyncedParams] = useState(searchParams);
  if (searchParams !== syncedParams) {
    setSyncedParams(searchParams);
    setSelectedCategory(searchParams.get('category') || null);
    setSearchQuery(searchParams.get('search') || '');
    setSellerId(searchParams.get('seller') || '');
  }

  const filters: ProductFilters = useMemo(() => ({
    category: selectedCategory || undefined,
    search: searchQuery || undefined,
    sort,
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
    minRating: minRating > 0 ? minRating : undefined,
    inStock: inStockOnly || undefined,
    sellerId: sellerId || undefined,
  }), [selectedCategory, searchQuery, sort, priceRange, minRating, inStockOnly, sellerId]);

  const { data, isLoading, isError, error } = useProducts(filters, page, ITEMS_PER_PAGE);
  const { data: categories = [] } = useCategories();
  const { data: sellers = [] } = useQuery({
    queryKey: ['sellers'],
    queryFn: () => apiFetch<{ sellers: { id: string; name: string; storeName?: string }[] }>('/sellers'),
    select: (d) => d.sellers,
    staleTime: 5 * 60 * 1000,
  });

  const total = data?.total ?? 0;
  const filtered = data?.products ?? [];
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const topCategories = categories.filter((c) => !c.parentId);

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setSort('popularity');
    setPriceRange({});
    setCustomMin('');
    setCustomMax('');
    setMinRating(0);
    setInStockOnly(false);
    setSellerId('');
    setPage(1);
    router.push('/products');
  };

  const hasActiveFilters = selectedCategory || searchQuery || sort !== 'popularity' || priceRange.min !== undefined || priceRange.max !== undefined || minRating > 0 || inStockOnly || sellerId;

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-lg text-error mb-2">Failed to load products</p>
        <p className="text-sm text-text-secondary mb-4">{error?.message || 'Please try again later.'}</p>
        <Button variant="outline" onClick={clearFilters}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {searchQuery ? `Search: "${searchQuery}"` : 'All Products'}
        </h1>
        <span className="text-sm text-text-secondary">{total} products</span>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-xl">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            onKeyDown={(e) => { if (e.key === 'Enter') setPage(1); }}
            placeholder="Search products..."
            className="w-full h-[48px] pl-11 pr-4 bg-bg border border-border rounded-[10px] text-base text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className={`${filtersOpen ? 'fixed inset-0 z-40 bg-bg p-6 overflow-y-auto' : 'hidden'} sm:block sm:relative sm:w-64 sm:flex-shrink-0`}>
          {filtersOpen && (
            <div className="flex items-center justify-between mb-4 sm:hidden">
              <h2 className="text-lg font-bold">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close" className="min-w-[48px] min-h-[48px] flex items-center justify-center">
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Category */}
          <Card className="p-4 mb-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wide">Category</h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => { setSelectedCategory(null); setPage(1); }}
                className={`text-left h-[40px] px-3 rounded-[8px] text-sm transition-colors ${
                  !selectedCategory ? 'bg-primary/10 text-primary-dark font-semibold' : 'text-text-secondary hover:bg-surface-alt'
                }`}
              >
                All Categories
              </button>
              {topCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
                  className={`text-left h-[40px] px-3 rounded-[8px] text-sm transition-colors ${
                    selectedCategory === cat.id ? 'bg-primary/10 text-primary-dark font-semibold' : 'text-text-secondary hover:bg-surface-alt'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </Card>

          {/* Price Range */}
          <Card className="p-4 mb-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wide">Price Range</h3>
            <div className="flex flex-col gap-1">
              {PRICE_RANGES.map((range, idx) => {
                const isActive = priceRange.min === range.min && priceRange.max === range.max;
                return (
                  <button
                    key={idx}
                    onClick={() => { setPriceRange({ min: range.min, max: range.max }); setPage(1); }}
                    className={`text-left h-[40px] px-3 rounded-[8px] text-sm transition-colors ${
                      isActive ? 'bg-primary/10 text-primary-dark font-semibold' : 'text-text-secondary hover:bg-surface-alt'
                    }`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input
                type="number"
                min={0}
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                placeholder="Min"
                aria-label="Minimum price"
                className="w-full min-w-0 h-[40px] px-2 rounded-[8px] border border-border bg-bg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-text-secondary">–</span>
              <input
                type="number"
                min={0}
                value={customMax}
                onChange={(e) => setCustomMax(e.target.value)}
                placeholder="Max"
                aria-label="Maximum price"
                className="w-full min-w-0 h-[40px] px-2 rounded-[8px] border border-border bg-bg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => {
                const min = Number(customMin);
                const max = Number(customMax);
                setPriceRange({
                  min: customMin && Number.isFinite(min) ? min : undefined,
                  max: customMax && Number.isFinite(max) ? max : undefined,
                });
                setPage(1);
              }}
            >
              Apply Custom Range
            </Button>
          </Card>

          {/* Availability */}
          <Card className="p-4 mb-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wide">Availability</h3>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => { setInStockOnly(e.target.checked); setPage(1); }}
                className="w-4 h-4 accent-[var(--color-primary)]"
              />
              <span className="text-sm text-text-secondary">In stock only</span>
            </label>
          </Card>

          {/* Seller */}
          {sellers.length > 0 && (
            <Card className="p-4 mb-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wide">Seller</h3>
              <select
                value={sellerId}
                onChange={(e) => { setSellerId(e.target.value); setPage(1); }}
                className="w-full h-[40px] px-2 rounded-[8px] border border-border bg-bg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Sellers</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.storeName || seller.name}
                  </option>
                ))}
              </select>
            </Card>
          )}

          {/* Rating Filter */}
          <Card className="p-4 mb-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wide">Minimum Rating</h3>
            <div className="flex flex-col gap-1">
              {[0, 4, 3, 2, 1].map((r) => (
                <button
                  key={r}
                  onClick={() => { setMinRating(r); setPage(1); }}
                  className={`text-left h-[40px] px-3 rounded-[8px] text-sm transition-colors flex items-center gap-1 ${
                    minRating === r ? 'bg-primary/10 text-primary-dark font-semibold' : 'text-text-secondary hover:bg-surface-alt'
                  }`}
                >
                  {r === 0 ? 'All Ratings' : (
                    <>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <StarIcon key={s} className="w-3.5 h-3.5 text-warning" filled={s <= r} />
                      ))}
                      <span className="ml-1">& Up</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </Card>

          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="w-full">
              Clear All Filters
            </Button>
          )}
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {/* Sort + Mobile Filter Toggle */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setFiltersOpen(true)}
              className="sm:hidden h-[40px] px-4 rounded-full text-sm font-semibold border border-border bg-surface text-text-secondary hover:bg-surface-alt"
            >
              Filters
            </button>
            <div className="flex-1" />
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="h-[40px] px-4 rounded-[10px] border border-border bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-surface-alt" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-surface-alt rounded w-3/4" />
                    <div className="h-3 bg-surface-alt rounded w-1/2" />
                    <div className="h-5 bg-surface-alt rounded w-1/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-text-secondary">No products found</p>
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-[40px] px-4 rounded-[10px] border border-border bg-surface text-sm font-semibold text-text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-alt transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`h-[40px] w-[40px] rounded-[10px] text-sm font-semibold transition-colors ${
                          page === pageNum
                            ? 'bg-primary text-text-inverse'
                            : 'border border-border bg-surface text-text-primary hover:bg-surface-alt'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-[40px] px-4 rounded-[10px] border border-border bg-surface text-sm font-semibold text-text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-alt transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

