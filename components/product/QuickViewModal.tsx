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
  /** Display name of the product's brand, when known. */
  brand?: { name: string };
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
    brand: product.brand?.name,
    categoryId: product.categoryId,
    inStock: (product.stockQuantity ?? 0) > 0,
  };
  const eligibility = eligibilityFor(compareProduct);
  const compareBlocked = eligibility.state === 'blocked' ? eligibility : null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      {/* A centred dialog at every size, with the image on the left and the
          product details on the right.

          The height is capped, not fixed, and capped in `dvh`: `vh` ignores the
          mobile URL bar, so a 92vh panel was taller than the visible area and
          pushed its own top edge — and the close button — off screen. A fixed
          `100dvh` was the opposite mistake, a full-bleed panel with rounded top
          corners and no visible edge. Content height with a cap is what this
          should be: short products get a short panel, long ones stop before the
          browser chrome. The close button sits in a non-scrolling header so it is
          reachable however long the body gets. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        tabIndex={-1}
        className="relative flex max-h-[88dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl bg-white shadow-xl outline-none sm:max-h-[90dvh] sm:max-w-3xl"
      >
        <div className="flex shrink-0 items-center justify-end px-3 pt-2 sm:absolute sm:right-4 sm:top-4 sm:z-10 sm:p-0">
          <button
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-full bg-white text-muted-500 shadow-sm transition-colors hover:bg-muted-100 hover:text-secondary"
            aria-label="Close"
          >
            <X size={18} className="shrink-0" />
          </button>
        </div>

        {/* Image left, details right, from the narrowest phone up.

            It was one column below `sm`, so the picture took the full width and
            the details started underneath it — on a 375px screen that left the
            name, price and actions below the fold. The tracks are
            `minmax(0, …)` so a long word in the details column can shrink
            instead of forcing the grid wider than the panel.

            Explicit per-side padding: `p-3` + `sm:p-6` would race the safe-area
            bottom inset, and the action row has to clear the home indicator. */}
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,42%)_minmax(0,1fr)] items-start gap-3 overflow-y-auto overscroll-contain px-3 pt-1 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:grid-cols-2 sm:gap-6 sm:px-6 sm:pt-6 sm:pb-6">
          {/* Image. `object-contain` because a catalogue photo must not be
              cropped to fill the square. */}
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted-50">
            <ImageWithFallback
              src={product.image}
              alt={product.name}
              fill
              className="object-contain p-2"
              sizes="(max-width: 640px) 42vw, (max-width: 1024px) 50vw, 384px"
            />
            {hasDiscount && (
              <Badge
                variant="danger"
                size="sm"
                className="absolute left-2 top-2"
              >
                -{discount}%
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="flex min-w-0 flex-col">
            {product.category?.name && (
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-primary-600 sm:text-xs">
                {product.category.name}
              </p>
            )}

            {/* Clamped and a step smaller on a phone. The details column is
                ~170px there and `body` sets `line-height: 2`, so an unclamped
                20px title ran to five lines and pushed the price and Add to Cart
                below the fold. The full string stays reachable from the tooltip
                and "View Full Details"; `break-words` covers the
                unbreakable-SKU case on pointer devices, where the body-level
                `overflow-wrap` guard does not apply. */}
            <h2
              className="mt-0.5 line-clamp-3 break-words font-heading text-sm font-bold text-secondary-800 sm:mt-1 sm:line-clamp-2 sm:text-xl"
              title={product.name}
            >
              {product.name}
            </h2>

            {product.brand?.name && (
              <p className="mt-1 truncate text-xs text-muted-500">
                by <span className="text-secondary-700">{product.brand.name}</span>
              </p>
            )}

            {/* Rating */}
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={
                      i < Math.round(product.rating)
                        ? 'fill-warning text-warning'
                        : 'text-muted-300'
                    }
                  />
                ))}
              </div>
              <span className="text-[11px] text-muted-500">
                ({product.reviewCount})
              </span>
            </div>

            {/* Price */}
            <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 sm:mt-4">
              <span className="text-xl font-bold text-dark sm:text-2xl">
                {formatPrice(price)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-muted-400 line-through sm:text-sm">
                  {formatPrice(original)}
                </span>
              )}
            </div>

            {/* Stock */}
            {product.stockQuantity != null && (
              <div className="mt-2 flex min-w-0 sm:mt-3">
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

            {/* Actions. Stacked below `sm` because the details column is only ~170px on a
                phone: the quantity stepper alone is 144px, so sharing a row with
                Add to Cart left nothing for the button's label. The wishlist and
                compare buttons drop their labels there too — icon plus an
                `sr-only` name keeps them at full tap size instead of truncating
                to nothing. */}
            <div className="mt-auto flex flex-col gap-2 pt-4 sm:gap-3 sm:pt-6">
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={product.stockQuantity ?? 99}
                  disabled={product.stockQuantity != null && product.stockQuantity <= 0}
                  className="shrink-0 [&>button]:h-10 [&>button]:w-10 [&>input]:h-10 [&>input]:w-11 sm:[&>button]:h-9 sm:[&>button]:w-9 sm:[&>input]:h-9 sm:[&>input]:w-12"
                />
                <Button
                  className="min-w-0 flex-1"
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
                  <ShoppingCart size={16} className="shrink-0" />
                  <span className="truncate">Add to Cart</span>
                </Button>
              </div>

              <div className="flex items-stretch gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="md"
                  className="min-w-0 flex-1 sm:flex-none sm:px-3"
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                  aria-pressed={isWishlisted}
                >
                  {isWishlisted ? (
                    <Check size={16} className="shrink-0 text-primary" />
                  ) : (
                    <Heart size={16} className="shrink-0" />
                  )}
                  <span className="sr-only sm:not-sr-only">
                    {isWishlisted ? 'Saved' : 'Wishlist'}
                  </span>
                </Button>
                <Button
                  variant={isInCompare ? 'primary' : 'outline'}
                  size="md"
                  className="min-w-0 flex-1 sm:flex-none sm:px-3"
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
                  <GitCompareArrows size={16} className="shrink-0" />
                  <span className="sr-only sm:not-sr-only">Compare</span>
                </Button>
              </div>

              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 sm:text-sm"
              >
                <Eye size={14} className="shrink-0" />
                View Full Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
