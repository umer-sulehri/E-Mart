'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product } from '@/components/product/ProductCard';
import ProductFilters from '@/components/product/ProductFilters';
import ProductGrid from '@/components/product/ProductGrid';
import Pagination from '@/components/product/Pagination';
import SortDropdown, { type SortValue } from '@/components/product/SortDropdown';
import SectionHeader from '@/components/ui/SectionHeader';
import { CATEGORIES } from '@/lib/constants';
import {
  EMPTY_FILTERS,
  activeFilterCount,
  filtersFromSearchParams,
  filtersToApiParams,
  filtersToSearchParams,
  type FilterState,
} from '@/lib/filterParams';
import {
  api,
  apiProductToCardProduct,
  type ApiProduct,
  type ApiListResponse,
} from '@/lib/api';

const ITEMS_PER_PAGE = 15;

const RATING_LABELS: Record<number, string> = {
  1: '1★ & up',
  2: '2★ & up',
  3: '3★ & up',
  4: '4★ & up',
  5: '5★ only',
};

function categoryName(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialSearch = searchParams.get('q') ?? '';
  const initialCategory = searchParams.get('category') ?? '';

  // URL query params are the source of truth for committed filters/sort, so
  // they survive navigation, are shareable, and drive browser back/forward.
  const [filters, setFilters] = useState<FilterState>(() =>
    filtersFromSearchParams(searchParams)
  );
  const [sort, setSort] = useState<SortValue>(
    (searchParams.get('sort') as SortValue) || 'newest'
  );
  const [currentPage, setCurrentPage] = useState(() =>
    Number(searchParams.get('page') || 1)
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [brandNames, setBrandNames] = useState<Record<string, string>>({});
  const [priceBounds, setPriceBounds] = useState<{ min: number; max: number }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Keep state in sync when the user navigates via back/forward or a link
  // that carries new query params.
  useEffect(() => {
    setFilters(filtersFromSearchParams(searchParams));
    setSort((searchParams.get('sort') as SortValue) || 'newest');
    setCurrentPage(Number(searchParams.get('page') || 1));
  }, [searchParams]);

  const applyFilters = useCallback(
    (next: FilterState, nextSort?: SortValue) => {
      const params = filtersToSearchParams(next, searchParams);

      const theSort = nextSort ?? sort;
      if (theSort !== 'newest') params.set('sort', theSort);
      else params.delete('sort');

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router, sort]
  );

  const clearAllFilters = useCallback(() => {
    const params = filtersToSearchParams(EMPTY_FILTERS, searchParams);
    router.push(`${pathname}?${params.toString()}`);
    toast.success('All filters cleared');
  }, [searchParams, pathname, router]);

  const handleSortChange = useCallback(
    (value: SortValue) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value !== 'newest') params.set('sort', value);
      else params.delete('sort');
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  useEffect(() => {
    fetch('/api/v1/brands')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const map: Record<string, string> = {};
          json.data.forEach((b: { slug: string; name: string }) => {
            map[b.slug] = b.name;
          });
          setBrandNames(map);
        }
      })
      .catch(() => {});
  }, []);

  // Real min/max product price keeps the slider aligned with the catalog.
  useEffect(() => {
    fetch('/api/v1/products/price-range')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setPriceBounds({ min: json.data.min, max: json.data.max });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sort, initialSearch]);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        setLoading(true);
        const params: Record<string, string> = {
          page: String(currentPage),
          limit: String(ITEMS_PER_PAGE),
          sort: sort === 'popularity' ? 'popular' : sort,
          status: 'active',
          ...filtersToApiParams(filters),
        };

        if (initialSearch.trim()) {
          params.search = initialSearch.trim();
        }

        if (filters.categories.length === 0 && initialCategory) {
          params.category = initialCategory;
        }

        const res = await api.products.list(params) as ApiListResponse<ApiProduct>;

        if (cancelled) return;

        if (res.success && res.data?.length) {
          setProducts(
            res.data.map(apiProductToCardProduct)
          );
          if (res.meta) {
            setTotalItems(res.meta.totalItems);
            setTotalPages(res.meta.totalPages);
          }
          setLoading(false);
        } else {
          setProducts([]);
          setTotalItems(0);
          setTotalPages(1);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setTotalItems(0);
          setTotalPages(1);
          setLoading(false);
        }
      }
    }

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [currentPage, sort, initialSearch, initialCategory, filters]);

  const filtersSidebar = (
    <ProductFilters
      filters={filters}
      onFilterChange={applyFilters}
      priceBounds={priceBounds}
    />
  );

  const mobileFiltersPanel = (
    <ProductFilters
      filters={filters}
      onFilterChange={applyFilters}
      onApplied={() => setMobileFiltersOpen(false)}
      priceBounds={priceBounds}
    />
  );

  return (
    <section className="py-8">
      <div className="container">
        <SectionHeader title="Products" viewAllLink="/" viewAllText="Back to Home" />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-500">
            Showing{' '}
            <span className="font-medium text-secondary-800">
              {totalItems}
            </span>{' '}
            {totalItems === 1 ? 'result' : 'results'}
            {initialSearch && (
              <span>
                {' '}
                for &quot;<span className="text-secondary-800">{initialSearch}</span>&quot;
              </span>
            )}
          </p>
          <SortDropdown value={sort} onChange={handleSortChange} />
        </div>

        {(filters.categories.length > 0 ||
          filters.minPrice !== '' ||
          filters.maxPrice !== '' ||
          filters.minRating > 0 ||
          filters.brands.length > 0 ||
          filters.inStockOnly ||
          filters.featuredOnly) && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {filters.categories.map((slug) => (
              <button
                key={slug}
                onClick={() => {
                  applyFilters({
                    ...filters,
                    categories: filters.categories.filter((c) => c !== slug),
                  });
                  toast.success('Filter removed');
                }}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                {categoryName(slug)}
                <X size={13} />
              </button>
            ))}
            {filters.minPrice !== '' && (
              <button
                onClick={() => applyFilters({ ...filters, minPrice: '' })}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                From {filters.minPrice}
                <X size={13} />
              </button>
            )}
            {filters.maxPrice !== '' && (
              <button
                onClick={() => applyFilters({ ...filters, maxPrice: '' })}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                Up to {filters.maxPrice}
                <X size={13} />
              </button>
            )}
            {filters.minRating > 0 && (
              <button
                onClick={() => applyFilters({ ...filters, minRating: 0 })}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                {RATING_LABELS[filters.minRating] || `${filters.minRating}★ & up`}
                <X size={13} />
              </button>
            )}
            {filters.brands.map((brand) => (
              <button
                key={brand}
                onClick={() => {
                  applyFilters({
                    ...filters,
                    brands: filters.brands.filter((b) => b !== brand),
                  });
                  toast.success('Filter removed');
                }}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                {brandNames[brand] || brand}
                <X size={13} />
              </button>
            ))}
            {filters.inStockOnly && (
              <button
                onClick={() => applyFilters({ ...filters, inStockOnly: false })}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                In stock
                <X size={13} />
              </button>
            )}
            {filters.featuredOnly && (
              <button
                onClick={() => applyFilters({ ...filters, featuredOnly: false })}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                Featured
                <X size={13} />
              </button>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-danger underline underline-offset-2 hover:text-danger-600"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">{filtersSidebar}</aside>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-secondary-800 px-5 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-secondary lg:hidden"
          >
            <SlidersHorizontal size={16} />
            Filters
            {activeFilterCount(filters) > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                {activeFilterCount(filters)}
              </span>
            )}
          </button>

          {/* Mobile filter drawer */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setMobileFiltersOpen(false)}
              />
              <div className="absolute inset-y-0 left-0 w-80 max-w-full overflow-y-auto bg-white p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-heading text-lg font-bold text-secondary-800">
                    Filters
                  </h3>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="rounded-lg p-1 text-muted-500 hover:bg-muted-100"
                  >
                    <X size={20} />
                  </button>
                </div>
                {mobileFiltersPanel}
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="min-w-0 flex-1">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                      <div className="mx-auto aspect-square w-full rounded-lg bg-muted-100" />
                      <div className="mt-3 mx-auto h-4 w-3/4 rounded bg-muted-100" />
                      <div className="mt-2 mx-auto h-3 w-1/2 rounded bg-muted-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <ProductGrid products={products} />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
