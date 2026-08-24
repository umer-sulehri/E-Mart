'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { StarIcon, HeartIcon } from '@/components/icons';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const wishlisted = useWishlistStore((s) => s.hasItem(product.id));
  const toggleItem = useWishlistStore((s) => s.toggleItem);

  const onSale = product.originalPrice && product.originalPrice > product.price;
  const outOfStock = product.stock <= 0;

  return (
    <div className="relative bg-surface rounded-[16px] border border-border shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
      {/* Wishlist Button - top right corner */}
      <button
        onClick={(e) => { e.preventDefault(); toggleItem(product.id); }}
        className="absolute top-3 right-3 min-w-[48px] min-h-[48px] flex items-center justify-center bg-surface/90 border border-border rounded-full hover:bg-error hover:border-error hover:text-white transition-all duration-200 z-30"
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <HeartIcon
          className={`w-5 h-5 ${wishlisted ? 'text-error' : 'text-text-secondary'}`}
          filled={wishlisted}
        />
      </button>

      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] bg-bg overflow-hidden">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          {onSale && (
            <span className="absolute top-3 left-3 bg-success text-text-inverse text-xs font-bold px-2 py-1 rounded-full z-10">
              -{Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)}%
            </span>
          )}
          {product.isNew && (
            <span className="absolute top-3 right-14 bg-primary text-text-inverse text-xs font-bold px-2 py-1 rounded-full z-10">
              NEW
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-base font-semibold text-text-primary mb-1 line-clamp-1 hover:text-primary-dark transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mb-2" aria-label={`Rating: ${product.rating} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon
              key={star}
              className="w-4 h-4 text-warning"
              filled={star <= Math.round(product.rating)}
            />
          ))}
          <span className="text-xs text-text-secondary ml-1">({product.reviewCount})</span>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-bold text-primary-dark">PKR {product.price.toLocaleString()}</span>
          {onSale && (
            <span className="text-sm text-text-secondary line-through">
              PKR {product.originalPrice!.toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-medium ${outOfStock ? 'text-error' : 'text-success'}`}
          >
            {outOfStock ? 'Out of Stock' : `${product.stock} in stock`}
          </span>
          <button
            disabled={outOfStock}
            onClick={(e) => {
              e.preventDefault();
              addItem(product);
            }}
            className={`min-h-[48px] px-4 py-1.5 rounded-[12px] transition-all duration-200 ${
              outOfStock
                ? 'bg-surface-alt text-text-secondary cursor-not-allowed'
                : 'bg-primary text-text-inverse hover:bg-primary-hover active:scale-95'
            }`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}


