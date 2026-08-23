'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { HeartIcon, StarIcon, MinusIcon, PlusIcon } from '@/components/icons';

interface ProductItemProps {
  product: Product;
  className?: string;
}

export function ProductItem({ product, className = '' }: ProductItemProps) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const wishlistHas = useWishlistStore((s) => s.hasItem(product.id));
  const [quantity, setQuantity] = useState(1);

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;
  const outOfStock = product.stock <= 0;

  return (
    <div className={`product-item ${className}`}>
      {discount !== null && (
        <span className="fm-badge" style={{ background: 'var(--color-success)', color: '#fff' }}>
          -{discount}%
        </span>
      )}
      {!outOfStock && product.isNew && discount === null && (
        <span className="fm-badge" style={{ background: 'var(--color-primary)', color: '#fff' }}>
          NEW
        </span>
      )}
      <button
        type="button"
        aria-label={wishlistHas ? 'Remove from wishlist' : 'Add to wishlist'}
        onClick={() => toggleWishlist(product.id)}
        className={`btn-wishlist ${wishlistHas ? 'active' : ''}`}
      >
        <HeartIcon className="w-5 h-5" />
      </button>

      <figure>
        <Link href={`/products/${product.slug}`} title={product.name} className="w-full flex justify-center">
          <Image
            src={product.images[0] || '/foodmart/product-thumb-1.png'}
            alt={product.name}
            width={300}
            height={210}
            className="tab-image"
            style={{ width: 'auto', maxHeight: 210 }}
          />
        </Link>
      </figure>

      <Link href={`/products/${product.slug}`} className="hover:text-primary transition-colors">
        <h3>{product.name}</h3>
      </Link>

      <div className="flex items-center gap-3 my-1">
        <span className="qty">{product.stock > 0 ? `${product.stock} In Stock` : 'Out of Stock'}</span>
        <span className="rating">
          <StarIcon className="w-4 h-4 text-primary" />
          {Number(product.rating).toFixed(1)}
        </span>
      </div>

      <span className="price">
        Rs {product.price.toLocaleString()}
        {product.originalPrice && product.originalPrice > product.price && (
          <del className="text-sm font-normal text-text-secondary ms-2">
            Rs {product.originalPrice.toLocaleString()}
          </del>
        )}
      </span>

      <div className="flex items-center justify-between mt-auto pt-1 gap-2">
        <div className="input-group product-qty">
          <button
            type="button"
            aria-label="Decrease quantity"
            className="btn-minus"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <MinusIcon className="w-3.5 h-3.5" />
          </button>
          <input
            type="number"
            aria-label="Quantity"
            value={quantity}
            min={1}
            onChange={(e) => setQuantity(Math.max(1, Math.min(Number(e.target.value) || 1, product.stock || 99)))}
          />
          <button
            type="button"
            aria-label="Increase quantity"
            className="btn-plus"
            onClick={() => setQuantity((q) => q + 1)}
          >
            <PlusIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          className="fm-add-to-cart"
          disabled={outOfStock}
          onClick={() => addItem(product, quantity)}
          style={outOfStock ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
        >
          Add to Cart
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path fill="currentColor" d="M8.5 19a1.5 1.5 0 1 0 1.5 1.5A1.5 1.5 0 0 0 8.5 19ZM19 16H7a1 1 0 0 1 0-2h8.491a3.013 3.013 0 0 0 2.885-2.176l1.585-5.55A1 1 0 0 0 19 5H6.74a3.007 3.007 0 0 0-2.82-2H3a1 1 0 0 0 0 2h.921a1.005 1.005 0 0 1 .962.725l.155.545v.005l1.641 5.742A3 3 0 0 0 7 18h12a1 1 0 0 0 0-2Zm-1.326-9l-1.22 4.274a1.005 1.005 0 0 1-.963.726H8.754l-.255-.892L7.326 7ZM16.5 19a1.5 1.5 0 1 0 1.5 1.5a1.5 1.5 0 0 0-1.5-1.5Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
