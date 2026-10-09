'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SlidersHorizontal, X } from 'lucide-react';
import type { Product } from '@/components/product/ProductCard';
import ProductFilters, { type FilterState } from '@/components/product/ProductFilters';
import { activeFilterCount, filterSignature, filtersFromSearchParams, filtersToSearchParams } from '@/lib/filterParams';
import ProductGrid from '@/components/product/ProductGrid';
import Pagination from '@/components/ui/Pagination';
import SortDropdown, { type SortValue } from '@/components/product/SortDropdown';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { usePageParam } from '@/hooks/usePageParam';
import { CATEGORIES } from '@/lib/constants';
import {
  api,
  apiProductToCardProduct,
  type ApiProduct,
  type ApiListResponse,
} from '@/lib/api';

const ITEMS_PER_PAGE = 15;

interface CategoryInfo {
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
}

function getCategoryInfo(slug: string): CategoryInfo {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  return {
    name: cat?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    slug,
    description: `Shop the best ${cat?.name || slug} products at E-Mart with fast delivery.`,
    thumbnail: cat?.thumbnail || '/images/category-thumb-1.jpg',
  };
}

export default function CategoryDetailPage() {
  return (
    <Suspense>
      <CategoryDetailContent />
    </Suspense>
  );
}

function CategoryDetailContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const slug = (params?.slug as string) || searchParams.get('category') || '';

  // URL query params hold the committed secondary filters (price, brand,
  // rating, stock), so they survive navigation, drive back/forward and are
  // shareable. The category itself stays in the path -- `slug` -- not the query.
  const [filters, setFilters] = useState<FilterState>(() => {
    const fromUrl = filtersFromSearchParams(searchParams);
    return { ...fromUrl, categories: slug ? [slug] : [] };
  });
  const [sort, setSort] = useState<SortValue>('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const categoryInfo = getCategoryInfo(slug);

  // `?page=` rather than local state, so a reload or a shared link lands on the
  // same page. Filters and sort reset it, because page 4 of the previous
  // result set is meaningless against a narrowed one.
  const { page: currentPage, setPage: setCurrentPage } = usePageParam({
    // Value signature rather than the object: `filters` is rebuilt whenever the
    // URL changes, so passing it directly would never register a change.
    resetOn: [slug, sort, filterSignature(filters)],
  });

  // Keep state in sync when the user navigates via back/forward into a URL
  // that carries filter params (e.g. a shared link, or the Back button after
  // viewing a product).
  useEffect(() => {
    const fromUrl = filtersFromSearchParams(searchParams);
    setFilters({ ...fromUrl, categories: slug ? [slug] : [] });
  }, [searchParams, slug]);

  const applyFilters = useCallback(
    (next: FilterState) => {
      // `scroll: false` keeps the page put while ticking a checkbox in the
      // drawer/sidebar; the grid updates live underneath.
      const params = filtersToSearchParams({
        ...next,
        categories: slug ? [slug] : [],
      });
      // The category is the path on this page, so it does not belong in the
      // query string too.
      params.delete('categories');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, slug]
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const params: Record<string, string> = {
          page: String(currentPage),
          limit: String(ITEMS_PER_PAGE),
          sort: sort === 'popularity' ? 'popular' : sort,
          status: 'active',
          category: slug,
        };

        if (filters.minPrice !== '') params.minPrice = filters.minPrice;
        if (filters.maxPrice !== '') params.maxPrice = filters.maxPrice;
        if (filters.minRating > 0) params.minRating = String(filters.minRating);
        if (filters.brands.length > 0) params.brands = filters.brands.join(',');
        if (filters.inStockOnly) params.inStock = 'true';
        if (filters.featuredOnly) params.featured = 'true';

        const res = await api.products.list(params) as ApiListResponse<ApiProduct>;

        if (cancelled) return;

        if (res.success && res.data?.length) {
          setProducts(res.data.map(apiProductToCardProduct));
          if (res.meta) {
            setTotalItems(res.meta.totalItems);
            setTotalPages(res.meta.totalPages);
          }
        } else {
          setProducts([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProducts();
    return () => { cancelled = true; };
  }, [currentPage, sort, slug, filters]);

  const filtersSidebar = (
    <ProductFilters filters={filters} onFilterChange={applyFilters} />
  );

  return (
    <>
      {/* Breadcrumb */}
      <section className="border-b border-muted-100 bg-white py-4">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: 'Categories', href: '/categories' },
              { label: categoryInfo.name },
            ]}
          />
        </div>
      </section>

      {/* Category Header */}
      <section className="relative h-48 bg-secondary-800 sm:h-56">
        <Image
          src={categoryInfo.thumbnail}
          alt={categoryInfo.name}
          fill
          className="object-cover opacity-30"
          sizes="100vw"
        />
        <div className="relative z-10 flex h-full items-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <h1 className="font-heading text-2xl font-bold text-white md:text-3xl">
              {categoryInfo.name}
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/80">
              {categoryInfo.description}
            </p>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-8">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-500">
              Showing{' '}
              <span className="font-medium text-secondary-800">{totalItems}</span>{' '}
              {totalItems === 1 ? 'product' : 'products'}
            </p>
            <SortDropdown value={sort} onChange={setSort} />
          </div>

          <div className="flex gap-6">
            {/* Desktop sidebar */}
            <aside className="hidden w-64 shrink-0 lg:block">{filtersSidebar}</aside>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-secondary-800 px-5 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-secondary lg:hidden"
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
              <div className="fixed inset-0 z-[65] lg:hidden">
                <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
                <div className="absolute inset-y-0 left-0 flex w-80 max-w-full flex-col bg-white pb-[env(safe-area-inset-bottom)] shadow-xl">
                  <div className="flex shrink-0 items-center justify-between border-b border-muted-100 p-5">
                    <h3 className="font-heading text-lg font-bold text-secondary-800">Filters</h3>
                    <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters" className="-mr-2 rounded-lg p-2.5 text-muted-500 transition-colors hover:bg-muted-100">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5">{filtersSidebar}</div>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="m-4 mt-0 w-[calc(100%-2rem)] shrink-0 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-500"
                  >
                    Show Results
                  </button>
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
                    totalItems={totalItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                    itemLabel="products"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
