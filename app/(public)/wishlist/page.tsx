'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useCartStore } from '@/lib/store/cartStore';
import { useProducts } from '@/hooks/useProducts';
import { HeartIcon, ShoppingCartIcon, TrashIcon, StarIcon } from '@/components/icons';

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const productIds = useMemo(() => items.map((wi) => wi.productId), [items]);
  const { data: productsData } = useProducts(
    { ids: productIds },
    1,
    Math.max(productIds.length, 1),
    { enabled: productIds.length > 0 },
  );

  const wishlistProducts = useMemo(() => {
    const byId = new Map((productsData?.products ?? []).map((p) => [p.id, p]));
    return items
      .map((wi) => byId.get(wi.productId))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);
  }, [items, productsData]);

  if (wishlistProducts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div
          className="w-[100px] h-[100px] mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(220,53,69,0.1), rgba(255,71,87,0.1))' }}
        >
          <HeartIcon className="w-16 h-16" style={{ color: 'var(--color-error)' }} />
        </div>
        <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>Your wishlist is empty</h1>
        <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>Save products you love for later.</p>
        <Link
          href="/products"
          className="inline-block px-8 py-3 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1"
          style={{ background: 'linear-gradient(135deg, #6B4E35, #3B2A1A)' }}
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          <HeartIcon className="w-10 h-10 inline-block mr-2" style={{ color: 'var(--color-error)' }} />
          My Wishlist
        </h1>
        <div className="w-[100px] h-1 mx-auto rounded-full mb-4" style={{ background: 'linear-gradient(90deg, var(--color-error), var(--color-primary))' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      {/* Stats Bar - Glassmorphism */}
      <div
        className="flex items-center justify-center gap-6 py-3 px-8 rounded-full mb-8 mx-auto w-fit"
        style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Items: <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{wishlistProducts.length}</span>
        </span>
        <span style={{ color: 'var(--color-text-secondary)' }}>|</span>
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Total Value: <span className="font-bold" style={{ color: 'var(--color-primary)' }}>
            Rs {wishlistProducts.reduce((sum, p) => sum + p.price, 0).toLocaleString()}
          </span>
        </span>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {wishlistProducts.map((product) => (
          <div
            key={product.id}
            className="rounded-[24px] overflow-hidden transition-all duration-300 hover:-translate-y-[10px] hover:scale-[1.02]"
            style={{
              background: 'white',
              boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
            }}
          >
            {/* Image */}
            <Link href={`/products/${product.slug}`}>
              <div className="relative h-[240px] overflow-hidden">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  loading="lazy"
                />
                {product.originalPrice && (
                  <span
                    className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--color-error), var(--color-error))' }}
                  >
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </span>
                )}
                {/* Remove Button */}
                <button
                  onClick={(e) => { e.preventDefault(); removeItem(product.id); }}
                  aria-label={`Remove ${product.name} from wishlist`}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                  style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: 'white' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-error)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; }}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </Link>

            {/* Card Info */}
            <div className="p-5">
              <p className="text-[12px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                {product.category?.name || 'Category'}
              </p>
              <Link href={`/products/${product.slug}`}>
                <h3 className="text-lg font-bold mb-2 line-clamp-2" style={{ color: 'var(--color-primary-dark)' }}>
                  {product.name}
                </h3>
              </Link>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, s) => (
                  <StarIcon
                    key={s}
                    className="w-4 h-4"
                    style={{ color: s < Math.round(product.rating) ? '#ffc107' : '#ddd' }}
                    filled={s < Math.round(product.rating)}
                  />
                ))}
                <span className="text-xs ml-1" style={{ color: 'var(--color-text-secondary)' }}>({product.reviewCount})</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[22px] font-bold" style={{ color: 'var(--color-primary-dark)' }}>
                  Rs {product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-sm line-through" style={{ color: '#999' }}>
                    Rs {product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => addItem(product)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #53858a, #0f1f26)' }}
                >
                  <ShoppingCartIcon className="w-4 h-4 inline-block mr-1" />
                  Add to Cart
                </button>
                <Link
                  href={`/products/${product.slug}`}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-center text-white transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #6B4E35, #3B2A1A)' }}
                >
                  View
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

