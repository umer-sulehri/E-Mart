'use client';

import ProductCard, { type Product } from '@/components/product/ProductCard';

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 text-6xl">🔍</div>
        <h3 className="font-heading text-xl font-bold text-secondary-800">
          No products found
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted-500">
          Try adjusting your filters or search terms to find what you&apos;re
          looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-stretch">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
