'use client';

import React from 'react';
import Link from 'next/link';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { Card } from '@/components/ui/Card';
import { StarIcon } from '@/components/icons';

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  return <CategoryPageInner params={params} />;
}

function CategoryPageInner({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = React.useState('');
  React.useEffect(() => { params.then((p) => setSlug(p.slug)); }, [params]);

  const { data: categories = [], isLoading: catsLoading } = useCategories();

  // Search both top-level categories AND their children by slug
  const category = React.useMemo(() => {
    if (!slug) return undefined;
    // First try top-level
    const top = categories.find((c) => c.slug === slug);
    if (top) return top;
    // Then search children
    for (const cat of categories) {
      if (cat.children) {
        const child = cat.children.find((c) => c.slug === slug);
        if (child) return { ...child, parent: cat };
      }
    }
    return undefined;
  }, [categories, slug]);

  // Determine if this is a parent or child category for filtering
  const categoryId = React.useMemo(() => {
    if (!category) return undefined;
    // If it's a child category (has parentId), filter by its own ID
    if ('parentId' in category && category.parentId) return category.id;
    // If it's a top-level category, filter by its ID (repo will include children)
    return category.id;
  }, [category]);

  const { data: productsData, isLoading: productsLoading } = useProducts(
    categoryId ? { category: categoryId } : undefined,
    1,
    50,
  );

  const products = productsData?.products ?? [];

  if (catsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-surface-alt rounded w-48" />
          <div className="h-12 bg-surface-alt rounded w-64" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-[4/3] bg-surface-alt" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-surface-alt rounded w-3/4" />
                  <div className="h-3 bg-surface-alt rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-lg text-text-secondary">Category not found</p>
        <Link href="/products" className="text-sm font-semibold text-primary-dark hover:underline mt-4 inline-block">
          Browse all products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-text-secondary">
          <li><Link href="/" className="hover:text-primary-dark">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-text-primary font-medium">{category.name}</li>
        </ol>
      </nav>

      {/* Category Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl" role="img" aria-label={category.name}>{category.icon}</span>
          <h1 className="text-3xl font-extrabold text-text-primary">{category.name}</h1>
        </div>
        {category.image && (
          <div className="mt-4 rounded-[16px] overflow-hidden h-48 bg-surface-alt border border-border">
            <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Subcategories */}
      {category.children && category.children.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-text-primary mb-4">Subcategories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {category.children.map((sub) => (
              <Link key={sub.id} href={`/categories/${sub.slug}`}>
                <Card className="p-4 text-center hover:shadow-md transition-shadow" variant="alt">
                  <span className="text-3xl mb-2 block" role="img" aria-label={sub.name}>{sub.icon}</span>
                  <span className="text-sm font-semibold text-text-primary">{sub.name}</span>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Products in Category */}
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-4">
          Products in {category.name} ({products.length})
        </h2>
        {productsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-surface-alt" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-surface-alt rounded w-3/4" />
                  <div className="h-3 bg-surface-alt rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">No products found in this category.</p>
            <Link href="/products" className="text-sm font-semibold text-primary-dark hover:underline mt-2 inline-block">
              Browse all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                  <div className="relative aspect-[4/3] bg-surface-alt">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                    {product.originalPrice && (
                      <span className="absolute top-2 left-2 bg-error text-text-inverse text-xs font-bold px-2 py-1 rounded-full">
                        -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
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
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
