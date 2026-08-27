'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Heart, ShoppingCart, Star, Eye, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import StockStatusIndicator from '@/components/ui/StockStatusIndicator';
import { useAddToCart } from '@/hooks/useAddToCart';
import { useAddToWishlist } from '@/hooks/useAddToWishlist';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { cn } from '@/lib/utils';

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
  category?: string;
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
  const {
    isWishlisted,
    toggleWishlist,
    wishlistLoading,
  } = useAddToWishlist(product?.id ?? '', product?.name ?? '');

  if (!open || !product) return null;

  const hasDiscount =
    product.discountPrice != null && product.discountPrice < product.price;
  const discount = hasDiscount
    ? calculateDiscount(product.price, product.discountPrice!)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-muted-500 shadow-sm transition-colors hover:text-secondary"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted-50">
            <Image
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
            {product.category && (
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                {product.category}
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
                {formatPrice(product.discountPrice ?? product.price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-400 line-through">
                  {formatPrice(product.price)}
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
                <div className="flex items-center rounded-lg border border-muted-200">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-muted-500 transition-colors hover:text-secondary"
                  >
                    -
                  </button>
                  <span className="min-w-[40px] text-center text-sm font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-muted-500 transition-colors hover:text-secondary"
                  >
                    +
                  </button>
                </div>
                <Button
                  className="flex-1"
                  size="md"
                  onClick={() => {
                    addToCart(product, quantity);
                    onClose();
                  }}
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
              </div>

              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-500"
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
