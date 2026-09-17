"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingCart, Heart, Eye, Check } from "lucide-react";
import StarRating from "@/components/ui/StarRating";
import QuickViewModal from "@/components/product/QuickViewModal";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useAddToWishlist } from "@/hooks/useAddToWishlist";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import QuantitySelector from "@/components/ui/QuantitySelector";
import { formatPrice, calculateDiscount, cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  badge?: string;
  stockQuantity?: number;
}

export interface ProductCardProps {
  product: Product;
  className?: string;
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({ product, className }, ref) => {
    const [quantity, setQuantity] = React.useState(1);
    const [quickViewOpen, setQuickViewOpen] = React.useState(false);
    const { addToCart } = useAddToCart();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const {
      isWishlisted,
      toggleWishlist,
      wishlistLoading,
    } = useAddToWishlist(product.id, product.name, { isAuthenticated });
    const discount = product.discountPrice
      ? calculateDiscount(product.price, product.discountPrice)
      : 0;

    return (
      <div
        ref={ref}
        className={cn("product-item flex h-full max-w-full flex-col", className)}
      >
        <figure className="image-container mx-auto mb-3 aspect-square w-full max-w-full overflow-hidden rounded-xl bg-white">
          <Link href={`/products/${product.slug}`} title={product.name}>
            <ImageWithFallback
              src={product.image}
              alt={product.name}
              width={420}
              height={420}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="h-full w-full object-contain p-2 sm:p-3"
            />
          </Link>
        </figure>

        <div className="flex flex-1 flex-col items-center text-center">
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-normal text-dark sm:min-h-[48px] sm:text-base">
            {product.name}
          </h3>

          {/* Visual separator between product info and rating/price */}
          <div className="mt-2 h-px w-full bg-muted-100" />

          {/* Fixed-height rating row keeps every card aligned */}
          <div className="mt-2 flex h-5 items-center">
            <StarRating
              rating={product.rating}
              size="sm"
              reviewCount={product.reviewCount}
            />
          </div>

          {/* Footer zone — mt-auto pins price/buttons to the bottom */}
          <div className="mt-auto w-full pt-2">
            <div className="flex min-h-[28px] flex-wrap items-center justify-center gap-x-2 gap-y-1">
              {product.discountPrice && (
                <del className="text-xs text-muted-500 sm:text-sm">
                  {formatPrice(product.price)}
                </del>
              )}
              <span className="text-base font-semibold text-dark sm:text-lg">
                {product.discountPrice
                  ? formatPrice(product.discountPrice)
                  : formatPrice(product.price)}
              </span>
              {discount > 0 && (
                <span className="rounded-none border border-dark-subtle px-1 py-0.5 text-[10px] font-normal leading-none text-muted-600">
                  {discount}% OFF
                </span>
              )}
              {product.badge && (
                <span className="rounded-none border border-dark-subtle px-1 py-0.5 text-[10px] font-normal leading-none text-muted-600">
                  {product.badge}
                </span>
              )}
            </div>

            {product.stockQuantity != null && product.stockQuantity <= 0 && (
              <p className="mt-1.5 text-[11px] font-medium text-danger">
                Out of stock
              </p>
            )}
            {product.stockQuantity != null &&
              product.stockQuantity > 0 &&
              product.stockQuantity < 10 && (
                <p className="mt-1.5 text-[11px] font-medium text-warning-600">
                  Only {product.stockQuantity} left — low stock
                </p>
              )}

            <div className="button-area w-full pt-3 lg:px-0 lg:pb-3">
              <div className="space-y-2">
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={product.stockQuantity ?? 99}
                  disabled={product.stockQuantity != null && product.stockQuantity <= 0}
                  className="h-11 w-full justify-between [&>button]:h-full [&>input]:h-full"
                />
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => addToCart(product, quantity)}
                    className="flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-primary p-2 text-xs text-white transition-all duration-200 hover:bg-primary-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label={`Add ${product.name} to cart`}
                    disabled={product.stockQuantity != null && product.stockQuantity <= 0}
                  >
                    <ShoppingCart size={16} className="shrink-0" />
                    <span className="hidden truncate sm:inline">Add to Cart</span>
                  </button>
                  <button
                    className="flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-dark px-2 text-dark transition-all duration-200 hover:bg-dark hover:text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label={`Quick view ${product.name}`}
                    onClick={() => setQuickViewOpen(true)}
                  >
                    <Eye size={16} className="shrink-0" />
                    <span className="hidden truncate sm:inline">View</span>
                  </button>
                  <button
                    className="flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-dark px-2 text-dark transition-all duration-200 hover:bg-dark hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
                    aria-label={
                      isWishlisted
                        ? `Remove ${product.name} from wishlist`
                        : `Add ${product.name} to wishlist`
                    }
                    aria-pressed={isWishlisted}
                    onClick={toggleWishlist}
                    disabled={wishlistLoading}
                  >
                    {isWishlisted ? (
                      <>
                        <Check size={16} className="shrink-0 text-primary" />
                        <span className="hidden truncate sm:inline">Saved</span>
                      </>
                    ) : (
                      <>
                        <Heart size={16} className="shrink-0" />
                        <span className="hidden truncate sm:inline">Wishlist</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <QuickViewModal
          product={product}
          open={quickViewOpen}
          onClose={() => setQuickViewOpen(false)}
        />
      </div>
    );
  }
);

ProductCard.displayName = "ProductCard";

export default ProductCard;
