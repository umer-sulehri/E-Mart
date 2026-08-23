'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';

export function ProductCard({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const wishlistHas = useWishlistStore((s) => s.hasItem(product.id));

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;
  const outOfStock = product.stock <= 0;

  return (
    <div className="product-item">
      {discount !== null && (
        <span className="badge bg-success position-absolute m-3">-{discount}%</span>
      )}
      <button
        type="button"
        className="btn-wishlist border-0 bg-transparent"
        aria-label="Add to Wishlist"
        style={{ color: wishlistHas ? '#f03838' : undefined }}
        onClick={() => toggleWishlist(product.id)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M20.16 4.61A6.27 6.27 0 0 0 12 4a6.27 6.27 0 0 0-8.16 9.48l7.45 7.45a1 1 0 0 0 1.42 0l7.45-7.45a6.27 6.27 0 0 0 0-8.87Zm-1.41 7.46L12 18.81l-6.75-6.74a4.28 4.28 0 0 1 3-7.3a4.25 4.25 0 0 1 3 1.25a1 1 0 0 0 1.42 0a4.27 4.27 0 0 1 6 6.05Z"
          />
        </svg>
      </button>
      <figure>
        <Link href={`/products/${product.slug}`} title={product.name}>
          <img
            src={product.images[0] || '/images/product-thumb-1.png'}
            className="tab-image"
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.dataset.fallback) return;
              img.dataset.fallback = '1';
              img.src = '/images/product-thumb-1.png';
            }}
          />
        </Link>
      </figure>
      <h3>{product.name}</h3>
      <span className="qty">{outOfStock ? 'Out of Stock' : 'In Stock'}</span>
      <span className="rating">
        <svg width="24" height="24" viewBox="0 0 24 24" className="text-primary">
          <path fill="currentColor" d="m17.5 21.9l-5.5-3.3l-5.5 3.3l1.4-6.3L2.9 11l6.4-.6L12 4.5l2.7 5.9l6.4.6l-5 4.6Z" />
        </svg>{' '}
        {Number(product.rating).toFixed(1)}
      </span>
      <span className="price">Rs {product.price.toLocaleString()}</span>
      <div className="d-flex align-items-center justify-content-between">
        <div className="input-group product-qty">
          <span className="input-group-btn">
            <button type="button" className="quantity-left-minus btn btn-danger btn-number" data-type="minus" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M5 11h14v2H5z" /></svg>
            </button>
          </span>
          <input type="text" readOnly value={qty} className="form-control input-number" aria-label={`Quantity for ${product.name}`} />
          <span className="input-group-btn">
            <button type="button" className="quantity-right-plus btn btn-success btn-number" data-type="plus" onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M13 11V5h-2v6H5v2h6v6h2v-6h6v-2z" /></svg>
            </button>
          </span>
        </div>
        <button
          type="button"
          className="nav-link border-0 bg-transparent d-inline-flex align-items-center gap-1"
          disabled={outOfStock}
          onClick={() => addItem(product, qty)}
          style={{ opacity: outOfStock ? 0.5 : 1 }}
        >
          Add to Cart
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M17 18a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2M9 18a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2M17 6a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m0-2c-.76 0-1.47.21-2.08.57L12.82 1H7v2h4.36l.79 2.12A4 4 0 0 0 10 9a4 4 0 0 0 4 4c.76 0 1.47-.21 2.08-.57L17.18 15H23v-2h-4.36l-.79-2.12A4 4 0 0 0 19 8a4 4 0 0 0-2-3.46V4Z" /></svg>
        </button>
      </div>
    </div>
  );
}
