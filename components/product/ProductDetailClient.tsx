'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import {
  StarIcon,
  ShoppingCartIcon,
  HeartIcon,
  TruckIcon,
  CheckCircleIcon,
  ShareIcon,
  StoreIcon,
  ArrowRightIcon,
} from '@/components/icons';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useToast } from '@/components/ui/Toast';

interface SellerOption {
  id: string;
  name: string;
  storeName?: string;
}

export function ProductDetailClient({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isWishlisted = useWishlistStore((s) => s.hasItem(product.id));
  const toast = useToast();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const { data: seller } = useQuery({
    queryKey: ['sellers'],
    queryFn: () => apiFetch<{ sellers: SellerOption[] }>('/sellers'),
    select: (d) => d.sellers.find((s) => s.id === product.sellerId),
    enabled: !!product.sellerId,
    staleTime: 5 * 60 * 1000,
  });

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: product.description.slice(0, 140), url });
        return;
      } catch {
        // User dismissed the share sheet â€” fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.showToast('Product link copied to clipboard.', 'success');
    } catch {
      toast.showToast('Could not copy the link.', 'error');
    }
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const images = product?.images?.length > 0 ? product.images : ['/placeholder.png'];

  return (
    <div className="flex flex-col gap-6">
      <nav className="text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-text-secondary flex-wrap">
          <li><Link href="/" className="hover:text-primary-dark transition-colors">Home</Link></li>
          <li aria-hidden="true" className="text-border">/</li>
          <li><Link href="/products" className="hover:text-primary-dark transition-colors">Products</Link></li>
          <li aria-hidden="true" className="text-border">/</li>
          {product.category && (
            <>
              <li aria-hidden="true" className="text-border">/</li>
              <li><Link href={`/categories/${product.category.slug}`} className="hover:text-primary-dark transition-colors">{product.category.name}</Link></li>
            </>
          )}
          <li aria-hidden="true" className="text-border">/</li>
          <li className="text-text-primary font-medium truncate max-w-[200px]">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square bg-surface rounded-[16px] border border-border overflow-hidden">
            <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
            {discount > 0 && (
              <span className="absolute top-3 left-3 bg-error text-white text-sm font-bold px-3 py-1 rounded-full">
                -{discount}%
              </span>
            )}
            {product.isNew && (
              <span className="absolute top-3 right-3 bg-success text-text-inverse text-sm font-bold px-3 py-1 rounded-full">
                NEW
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-[8px] border-2 overflow-hidden transition-colors ${
                    i === activeImage ? 'border-primary' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs font-semibold text-primary-dark uppercase tracking-wide">{product.category?.name ?? 'Category'}</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1 leading-tight">{product.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <StarIcon key={s} className="w-5 h-5 text-warning" filled={s <= Math.round(product.rating)} />
              ))}
            </div>
            <span className="text-sm font-medium text-text-primary">{product.rating}</span>
            <span className="text-sm text-text-secondary">({product.reviewCount} reviews)</span>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-extrabold text-text-primary">Rs {product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="text-lg text-text-secondary line-through">Rs {product.originalPrice.toLocaleString()}</span>
            )}
            {discount > 0 && (
              <span className="bg-error/10 text-error text-sm font-bold px-3 py-1 rounded-full">
                Save Rs {(product.originalPrice! - product.price).toLocaleString()}
              </span>
            )}
          </div>

          <p className="text-text-secondary leading-relaxed">{product.description}</p>

          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${product.stock > 0 ? 'bg-success' : 'bg-error'}`} />
            <span className={`text-sm font-medium ${product.stock > 0 ? 'text-success' : 'text-error'}`}>
              {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <div className="flex items-center border border-border rounded-[10px] overflow-hidden bg-bg">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}
                className="w-12 h-12 flex items-center justify-center text-text-secondary hover:bg-surface-alt transition-colors disabled:opacity-40"
                aria-label="Decrease quantity">
                &#8722;
              </button>
              <span className="w-12 text-center text-base font-semibold text-text-primary">{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock}
                className="w-12 h-12 flex items-center justify-center text-text-secondary hover:bg-surface-alt transition-colors disabled:opacity-40"
                aria-label="Increase quantity">
                +
              </button>
            </div>
            <Button size="lg" className="flex-1" disabled={product.stock === 0} onClick={handleAddToCart}>
              <ShoppingCartIcon className="w-5 h-5" />
              {added ? 'Added to Cart!' : 'Add to Cart'}
            </Button>
            <button onClick={() => toggleWishlist(product.id)}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className={`w-12 h-12 flex items-center justify-center rounded-[10px] border-2 transition-all ${
                isWishlisted ? 'border-error bg-error/10 text-error' : 'border-border text-text-secondary hover:border-error/50 hover:text-error'
              }`}>
              <HeartIcon className="w-5 h-5" filled={isWishlisted} />
            </button>
            <button onClick={handleShare}
              aria-label="Share this product"
              className="w-12 h-12 flex items-center justify-center rounded-[10px] border-2 border-border text-text-secondary hover:border-primary/50 hover:text-primary transition-all">
              <ShareIcon className="w-5 h-5" />
            </button>
          </div>

          {seller && (
            <div className="bg-surface border border-border rounded-[12px] p-4 flex items-center justify-between gap-3 mt-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary-dark flex items-center justify-center flex-shrink-0">
                  <StoreIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">{seller.storeName || seller.name}</p>
                  <p className="text-xs text-text-secondary inline-flex items-center gap-1">
                    Verified Seller
                    <CheckCircleIcon className="w-3.5 h-3.5 text-success" />
                  </p>
                </div>
              </div>
              <Link
                href={`/products?seller=${seller.id}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary-dark hover:underline whitespace-nowrap"
              >
                View products
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          )}

          <div className="bg-surface border border-border rounded-[12px] p-4 flex flex-col gap-3 mt-2">
            <div className="flex items-center gap-3">
              <TruckIcon className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Free Delivery</p>
                <p className="text-xs text-text-secondary">On orders over Rs 2,000</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-success flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Easy Returns</p>
                <p className="text-xs text-text-secondary">7-day return policy</p>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-4 border-t border-border">
            <h3 className="text-sm font-bold text-text-primary mb-3 uppercase tracking-wide">Product Details</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-text-secondary">Category</dt>
              <dd className="text-text-primary font-medium">{product.category?.name ?? '-'}</dd>
              <dt className="text-text-secondary">SKU</dt>
              <dd className="text-text-primary font-medium">{product.id.toUpperCase()}</dd>
              <dt className="text-text-secondary">Tags</dt>
              <dd className="text-text-primary font-medium">{product.tags.join(', ')}</dd>
              <dt className="text-text-secondary">Availability</dt>
              <dd className="text-text-primary font-medium">{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

