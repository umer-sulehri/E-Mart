'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Home, SlidersHorizontal, X } from 'lucide-react';
import type { Product } from '@/components/product/ProductCard';
import ProductFilters, { type FilterState } from '@/components/product/ProductFilters';
import ProductGrid from '@/components/product/ProductGrid';
import Pagination from '@/components/product/Pagination';
import SortDropdown, { type SortValue } from '@/components/product/SortDropdown';
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
    thumbnail: cat?.thumbnail || '/images/categories/default.jpg',
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
  const slug = searchParams.get('category') || '';

  const [filters, setFilters] = useState<FilterState>({
    categories: slug ? [slug] : [],
    minPrice: '',
    maxPrice: '',
    minRating: 0,
  });
  const [sort, setSort] = useState<SortValue>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const categoryInfo = getCategoryInfo(slug);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sort, slug]);

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
    <ProductFilters filters={filters} onFilterChange={setFilters} />
  );

  return (
    <>
      {/* Breadcrumb */}
      <section className="border-b border-muted-100 bg-white py-4">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-600">
            <Link href="/" className="flex items-center gap-1 text-muted-600 transition-colors hover:text-primary">
              <Home size={14} />
              Home
            </Link>
            <ChevronRight size={12} className="text-muted-400" />
            <Link href="/categories" className="text-muted-600 transition-colors hover:text-primary">
              Categories
            </Link>
            <ChevronRight size={12} className="text-muted-400" />
            <span className="font-medium text-secondary-800">{categoryInfo.name}</span>
          </nav>
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
              className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-secondary-800 px-5 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-secondary lg:hidden"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>

            {/* Mobile filter drawer */}
            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
                <div className="absolute inset-y-0 left-0 w-80 max-w-full overflow-y-auto bg-white p-5 shadow-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-heading text-lg font-bold text-secondary-800">Filters</h3>
                    <button onClick={() => setMobileFiltersOpen(false)} className="rounded-lg p-1 text-muted-500 hover:bg-muted-100">
                      <X size={20} />
                    </button>
                  </div>
                  {filtersSidebar}
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-500"
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
