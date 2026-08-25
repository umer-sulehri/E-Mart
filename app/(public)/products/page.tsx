'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import {
  bestSellingProducts,
  featuredProducts,
  popularProducts,
  newArrivals,
} from '@/lib/mock/products';
import type { Product } from '@/components/product/ProductCard';
import ProductFilters, {
  type FilterState,
} from '@/components/product/ProductFilters';
import ProductGrid from '@/components/product/ProductGrid';
import Pagination from '@/components/product/Pagination';
import SortDropdown, { type SortValue } from '@/components/product/SortDropdown';
import SectionHeader from '@/components/ui/SectionHeader';

const ITEMS_PER_PAGE = 15;

const allProducts: Product[] = (() => {
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
  const initialSearch = searchParams.get('q') ?? '';

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    minPrice: '',
    maxPrice: '',
    minRating: 0,
  });
  const [sort, setSort] = useState<SortValue>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sort, initialSearch]);

  const filteredProducts = useMemo(() => {
    let result = allProducts;

    if (initialSearch.trim()) {
      const query = initialSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query)
      );
    }

    if (filters.categories.length > 0) {
      result = result.filter(() => {
        return true;
      });
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

    return sortProducts(result, sort);
  }, [filters, sort, initialSearch]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const filtersSidebar = (
    <ProductFilters filters={filters} onFilterChange={setFilters} />
  );

  return (
    <section className="py-8">
      <div className="container">
        <SectionHeader title="Products" viewAllLink="/" viewAllText="Back to Home" />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-500">
            Showing{' '}
            <span className="font-medium text-secondary-800">
              {filteredProducts.length}
            </span>{' '}
            {filteredProducts.length === 1 ? 'result' : 'results'}
            {initialSearch && (
              <span>
                {' '}
                for &quot;<span className="text-secondary-800">{initialSearch}</span>&quot;
              </span>
            )}
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
            <ProductGrid products={paginatedProducts} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
