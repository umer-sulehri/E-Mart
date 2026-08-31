'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product } from '@/components/product/ProductCard';
import ProductFilters, {
  type FilterState,
} from '@/components/product/ProductFilters';
import ProductGrid from '@/components/product/ProductGrid';
import Pagination from '@/components/product/Pagination';
import SortDropdown, { type SortValue } from '@/components/product/SortDropdown';
import SectionHeader from '@/components/ui/SectionHeader';
import { CATEGORIES } from '@/lib/constants';
import {
  api,
  apiProductToCardProduct,
  type ApiProduct,
  type ApiListResponse,
} from '@/lib/api';
import {
  bestSellingProducts,
  featuredProducts,
  popularProducts,
  newArrivals,
} from '@/lib/mock/products';

const ITEMS_PER_PAGE = 15;

const allMockProducts: Product[] = (() => {
  const map = new Map<string, Product>();
  for (const p of [
    ...bestSellingProducts,
    ...featuredProducts,
    ...popularProducts,
    ...newArrivals,
  ]) {
    map.set(p.id, p);
  }
  return Array.from(map.values());
})();

const BRAND_NAMES: Record<string, string> = {
  'nature-best': "Nature's Best",
  'farm-fresh': 'Farm Fresh',
  'organic-valley': 'Organic Valley',
  'green-harvest': 'Green Harvest',
  'pure-earth': 'Pure Earth',
  'meadow-gold': 'Meadow Gold',
};

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

function activeFilterCount(filters: FilterState): number {
  let count = 0;
  if (filters.categories.length > 0) count++;
  if (filters.minPrice !== '' || filters.maxPrice !== '') count++;
  if (filters.minRating > 0) count++;
  if (filters.brands.length > 0) count++;
  if (filters.inStockOnly) count++;
  return count;
}

function sortProducts(products: Product[], sort: SortValue): Product[] {
  const sorted = [...products];
  switch (sort) {
    case 'newest':
      return sorted.reverse();
    case 'price_asc':
      return sorted.sort(
        (a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price)
      );
    case 'price_desc':
      return sorted.sort(
        (a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price)
      );
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'popularity':
      return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
    default:
      return sorted;
  }
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
  const [filters, setFilters] = useState<FilterState>(() => ({
    categories: searchParams.get('category') ? [searchParams.get('category')!] : [],
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    minRating: Number(searchParams.get('minRating') || 0),
    brands: searchParams.get('brand') ? [searchParams.get('brand')!] : [],
    inStockOnly: searchParams.get('inStock') === 'true',
  }));
  const [sort, setSort] = useState<SortValue>(
    (searchParams.get('sort') as SortValue) || 'newest'
  );
  const [currentPage, setCurrentPage] = useState(() =>
    Number(searchParams.get('page') || 1)
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [useApi, setUseApi] = useState(true);

  // Keep state in sync when the user navigates via back/forward or a link
  // that carries new query params.
  useEffect(() => {
    setFilters({
      categories: searchParams.get('category')
        ? [searchParams.get('category')!]
        : [],
      minPrice: searchParams.get('minPrice') ?? '',
      maxPrice: searchParams.get('maxPrice') ?? '',
      minRating: Number(searchParams.get('minRating') || 0),
      brands: searchParams.get('brand') ? [searchParams.get('brand')!] : [],
      inStockOnly: searchParams.get('inStock') === 'true',
    });
    setSort((searchParams.get('sort') as SortValue) || 'newest');
    setCurrentPage(Number(searchParams.get('page') || 1));
  }, [searchParams]);

  const applyFilters = useCallback(
    (next: FilterState, nextSort?: SortValue) => {
      const params = new URLSearchParams(searchParams.toString());
      const setIf = (key: string, value: string | undefined) => {
        if (value) params.set(key, value);
        else params.delete(key);
      };

      setIf('category', next.categories[0]);
      setIf('minPrice', next.minPrice || undefined);
      setIf('maxPrice', next.maxPrice || undefined);
      setIf('minRating', next.minRating > 0 ? String(next.minRating) : undefined);
      setIf('brand', next.brands[0]);
      setIf('inStock', next.inStockOnly ? 'true' : undefined);
      params.delete('page');

      const theSort = nextSort ?? sort;
      setIf('sort', theSort !== 'newest' ? theSort : undefined);

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router, sort]
  );

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('minPrice');
    params.delete('maxPrice');
    params.delete('minRating');
    params.delete('brand');
    params.delete('inStock');
    params.delete('page');
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
    setCurrentPage(1);
  }, [filters, sort, initialSearch]);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      if (!useApi) {
        // Fallback to client-side filtering with mock data
        let result = allMockProducts;

        if (initialSearch.trim()) {
          const query = initialSearch.toLowerCase();
          result = result.filter(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              p.slug.toLowerCase().includes(query)
          );
        }

        if (filters.minPrice !== '') {
          const min = parseFloat(filters.minPrice);
          if (!isNaN(min)) {
            result = result.filter(
              (p) => (p.discountPrice ?? p.price) >= min
            );
          }
        }

        if (filters.maxPrice !== '') {
          const max = parseFloat(filters.maxPrice);
          if (!isNaN(max)) {
            result = result.filter(
              (p) => (p.discountPrice ?? p.price) <= max
            );
          }
        }

        if (filters.minRating > 0) {
          result = result.filter((p) => p.rating >= filters.minRating);
        }

        const sorted = sortProducts(result, sort);
        const total = Math.ceil(sorted.length / ITEMS_PER_PAGE);
        const paginated = sorted.slice(
          (currentPage - 1) * ITEMS_PER_PAGE,
          currentPage * ITEMS_PER_PAGE
        );

        if (!cancelled) {
          setProducts(paginated);
          setTotalItems(sorted.length);
          setTotalPages(total);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const params: Record<string, string> = {
          page: String(currentPage),
          limit: String(ITEMS_PER_PAGE),
          sort: sort === 'popularity' ? 'popular' : sort,
          status: 'active',
        };

        if (initialSearch.trim()) {
          params.search = initialSearch.trim();
        }

        if (filters.categories.length > 0) {
          params.category = filters.categories[0];
        } else if (initialCategory) {
          params.category = initialCategory;
        }

        if (filters.minPrice !== '') {
          params.minPrice = filters.minPrice;
        }

        if (filters.maxPrice !== '') {
          params.maxPrice = filters.maxPrice;
        }

        if (filters.minRating > 0) {
          params.minRating = String(filters.minRating);
        }

        if (filters.brands.length > 0) {
          params.brand = filters.brands[0];
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
          // API returned no data — fall back to mock
          setUseApi(false);
        }
      } catch {
        if (!cancelled) {
          setUseApi(false);
        }
      }
    }

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [currentPage, sort, initialSearch, initialCategory, filters, useApi]);

  const filtersSidebar = (
    <ProductFilters filters={filters} onFilterChange={applyFilters} />
  );

  const mobileFiltersPanel = (
    <ProductFilters
      filters={filters}
      onFilterChange={applyFilters}
      onApplied={() => setMobileFiltersOpen(false)}
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
          filters.inStockOnly) && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {filters.categories.map((slug) => (
              <button
                key={slug}
                onClick={() => {
                  applyFilters({ ...filters, categories: [] });
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
                  applyFilters({ ...filters, brands: [] });
                  toast.success('Filter removed');
                }}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                {BRAND_NAMES[brand] || brand}
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
                      <div className="mx-auto h-[210px] w-[210px] rounded-lg bg-muted-100" />
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
