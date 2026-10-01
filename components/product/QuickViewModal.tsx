'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X, Heart, ShoppingCart, Star, Eye, Check, GitCompareArrows } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StockStatusIndicator from '@/components/ui/StockStatusIndicator';
import QuantitySelector from '@/components/ui/QuantitySelector';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { useAddToCart } from '@/hooks/useAddToCart';
import { useAddToWishlist } from '@/hooks/useAddToWishlist';
import {
  useCompareToggle,
  type ComparableProduct,
} from '@/hooks/useCompareToggle';
import { useBodyScrollLock, useEscapeKey } from '@/hooks/useOverlay';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, resolvePriceDisplay, cn } from '@/lib/utils';

export interface QuickViewProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  stockQuantity?: number;
  description?: string;
  /** Display name of the product's category, when known. */
  category?: { name: string };
  /** Required so the compare rule can enforce a single category. */
  categoryId: string;
}

interface QuickViewModalProps {
  product: QuickViewProduct | null;
  open: boolean;
  onClose: () => void;
}

export default function QuickViewModal({
  product,
  open,
  onClose,
}: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useAddToCart();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const {
    isWishlisted,
    toggleWishlist,
    wishlistLoading,
  } = useAddToWishlist(product?.id ?? '', product?.name ?? '', { isAuthenticated });
  const { isCompared, toggle: compareToggle, eligibilityFor } =
    useCompareToggle();
  const isInCompare = product ? isCompared(product.id) : false;

  const panelRef = useRef<HTMLDivElement>(null);

  // Reference-counted so opening QuickView from the cart drawer does not
  // re-enable background scrolling behind the still-open drawer.
  useBodyScrollLock(open);
  useEscapeKey(open, onClose);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open || !product) return null;

  const {
    current: price,
    original,
    discountPercent: discount,
  } = resolvePriceDisplay(product.price, product.discountPrice);
  const hasDiscount = original !== null;

  const compareProduct: ComparableProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    discountPrice: product.discountPrice,
    rating: product.rating,
    reviewCount: product.reviewCount,
    image: product.image,
    category: product.category?.name,
    categoryId: product.categoryId,
    inStock: (product.stockQuantity ?? 0) > 0,
  };
  const eligibility = eligibilityFor(compareProduct);
  const compareBlocked = eligibility.state === 'blocked' ? eligibility : null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      {/* Height-capped shell: the panel itself scrolls, so the discount badge,
          price and Add to Cart stay reachable on a 360px-tall phone. The close
          button lives in a non-scrolling header for the same reason. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        tabIndex={-1}
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl outline-none sm:max-w-3xl sm:max-h-[90vh] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-end px-3 pt-3 sm:absolute sm:right-4 sm:top-4 sm:z-10 sm:p-0">
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-muted-500 shadow-sm transition-colors hover:bg-muted-100 hover:text-secondary"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto overscroll-contain p-6 pt-0 sm:grid-cols-2 sm:pt-6">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted-50">
            <ImageWithFallback
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
            {hasDiscount && (
              <Badge
                variant="danger"
                size="sm"
                className="absolute left-3 top-3"
              >
                -{discount}%
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {product.category?.name && (
              <p className="text-xs font-medium uppercase tracking-wide text-primary-600">
                {product.category.name}
              </p>
            )}

            <h2 className="mt-1 font-heading text-xl font-bold text-secondary-800">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i < Math.round(product.rating)
                        ? 'fill-warning text-warning'
                        : 'text-muted-300'
                    }
                  />
                ))}
              </div>
              <span className="text-xs text-muted-500">
                ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-dark">
                {formatPrice(price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-400 line-through">
                  {formatPrice(original)}
                </span>
              )}
            </div>

            {/* Stock */}
            {product.stockQuantity != null && (
              <div className="mt-3">
                <StockStatusIndicator
                  stock={product.stockQuantity}
                  showQuantity
                />
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="mt-4 text-sm leading-relaxed text-muted-600 line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Quantity + Actions */}
            <div className="mt-auto flex flex-col gap-3 pt-6">
              <div className="flex items-center gap-3">
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={product.stockQuantity ?? 99}
                  disabled={product.stockQuantity != null && product.stockQuantity <= 0}
                />
                <Button
                  className="flex-1"
                  size="md"
                  onClick={() => {
                    addToCart(product, quantity);
                    onClose();
                  }}
                  disabled={
                    product.stockQuantity != null &&
                    product.stockQuantity <= 0
                  }
                >
                  <ShoppingCart size={16} />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="px-3"
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                  aria-pressed={isWishlisted}
                >
                  {isWishlisted ? (
                    <Check size={16} className="text-primary" />
                  ) : (
                    <Heart size={16} />
                  )}
                </Button>
                <Button
                  variant={isInCompare ? 'primary' : 'outline'}
                  size="md"
                  className="px-3"
                  onClick={() => compareToggle(compareProduct)}
                  // Marked, not disabled: the click still reaches the guarded
                  // store action, which explains the refusal and offers to
                  // replace the tray.
                  title={compareBlocked ? compareBlocked.message : undefined}
                  aria-pressed={isInCompare}
                  aria-label={
                    isInCompare
                      ? `Remove ${product.name} from compare`
                      : compareBlocked
                        ? compareBlocked.message
                        : `Add ${product.name} to compare`
                  }
                >
                  <GitCompareArrows size={16} />
                </Button>
              </div>

              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
              >
                <Eye size={14} />
                View Full Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
