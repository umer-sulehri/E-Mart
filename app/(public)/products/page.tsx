'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Product, ProductFilters } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StarIcon, CloseIcon, SearchIcon } from '@/components/icons';

const ITEMS_PER_PAGE = 20;

const SORT_OPTIONS = [
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
  const [sort, setSort] = useState('newest');
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [minRating, setMinRating] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Keep local filter state in sync when the URL changes (e.g. back/forward navigation).
  const [syncedParams, setSyncedParams] = useState(searchParams);
  if (searchParams !== syncedParams) {
    setSyncedParams(searchParams);
    setSelectedCategory(searchParams.get('category') || null);
    setSearchQuery(searchParams.get('search') || '');
  }

  const filters: ProductFilters = useMemo(() => ({
    category: selectedCategory || undefined,
    search: searchQuery || undefined,
    sort,
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
    minRating: minRating > 0 ? minRating : undefined,
  }), [selectedCategory, searchQuery, sort, priceRange, minRating]);

  const { data, isLoading, isError, error } = useProducts(filters, page, ITEMS_PER_PAGE);
  const { data: categories = [] } = useCategories();

  const total = data?.total ?? 0;
  const filtered = data?.products ?? [];
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const topCategories = categories.filter((c) => !c.parentId);

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setSort('newest');
    setPriceRange({});
    setMinRating(0);
    setPage(1);
    router.push('/products');
  };

  const hasActiveFilters = selectedCategory || searchQuery || sort !== 'newest' || priceRange.min !== undefined || priceRange.max !== undefined || minRating > 0;

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
          </Card>

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
                  <ProductGridCard key={product.id} product={product} />
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

function ProductGridCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
        <div className="relative aspect-[4/3] bg-surface-alt">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {product.originalPrice && (
            <span className="absolute top-2 left-2 bg-error text-text-inverse text-xs font-bold px-2 py-1 rounded-full">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </span>
          )}
          {product.isNew && (
            <span className="absolute top-2 right-2 bg-success text-text-inverse text-xs font-bold px-2 py-1 rounded-full">
              NEW
            </span>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold text-text-primary mb-1 line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-1 mb-2">
            <StarIcon className="w-4 h-4 text-warning" filled />
            <span className="text-xs text-text-secondary">{product.rating} ({product.reviewCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-text-primary">Rs {product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="text-xs text-text-secondary line-through">
                Rs {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <span className={`text-xs mt-1 inline-block ${product.stock > 0 ? 'text-success' : 'text-error'}`}>
            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </Card>
    </Link>
  );
}
