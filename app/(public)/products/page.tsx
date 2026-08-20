'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Product, ProductFilters } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StarIcon, CloseIcon } from '@/components/icons';

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const filters: ProductFilters = useMemo(() => ({
    category: selectedCategory || undefined,
    sort: 'newest',
  }), [selectedCategory]);

  const { data, isLoading, isError, error } = useProducts(filters, page);
  const { data: categories = [] } = useCategories();

  const total = data?.total ?? 0;
  const filtered = data?.products ?? [];

  const topCategories = categories.filter((c) => !c.parentId);

  const clearFilters = () => {
    setSelectedCategory(null);
    setPage(1);
  };

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
        <h1 className="text-2xl font-bold text-text-primary">All Products</h1>
        <span className="text-sm text-text-secondary">{total} products</span>
      </div>

      <div className="flex gap-6">
        {/* Category Sidebar */}
        <aside className={`${filtersOpen ? 'fixed inset-0 z-40 bg-bg p-6 overflow-y-auto' : 'hidden'} sm:block sm:relative sm:w-64 sm:flex-shrink-0`}>
          {filtersOpen && (
            <div className="flex items-center justify-between mb-4 sm:hidden">
              <h2 className="text-lg font-bold">Categories</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close" className="min-w-[48px] min-h-[48px] flex items-center justify-center">
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
          )}
          <Card className="p-4">
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
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((product) => (
                <ProductGridCard key={product.id} product={product} />
              ))}
            </div>
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
