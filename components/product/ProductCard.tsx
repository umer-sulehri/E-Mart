"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingCart, Heart, Eye, Check, GitCompareArrows } from "lucide-react";
import StarRating from "@/components/ui/StarRating";
import QuickViewModal from "@/components/product/QuickViewModal";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useAddToWishlist } from "@/hooks/useAddToWishlist";
import { useCompareToggle, type ComparableProduct } from "@/hooks/useCompareToggle";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import QuantitySelector from "@/components/ui/QuantitySelector";
import { formatPrice, resolvePriceDisplay, cn } from "@/lib/utils";
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
  /**
   * Required so the compare rule can enforce a single category. Cards render
   * the compare toggle unconditionally, so every caller must supply it.
   */
  categoryId: string;
  category?: { name: string };
  brand?: { name: string };
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
    const { isCompared, toggle: compareToggle, eligibilityFor } =
      useCompareToggle();
    const isInCompare = isCompared(product.id);

    // One payload, shared by the eligibility check and the click handler, so the
    // button's state and what the click actually submits cannot disagree.
    // `eligibilityFor` is a pure, cheap check over the tray, so it needs no
    // memoisation.
    const compareProduct: ComparableProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discountPrice: product.discountPrice ?? undefined,
      rating: product.rating,
      reviewCount: product.reviewCount,
      image: product.image,
      category: product.category?.name || '',
      categoryId: product.categoryId,
      brand: product.brand?.name || '',
      inStock: (product.stockQuantity ?? 0) > 0,
    };
    const compareEligibility = eligibilityFor(compareProduct);
    const compareBlocked =
      compareEligibility.state === 'blocked' ? compareEligibility : null;
    const { current: price, original, discountPercent } = resolvePriceDisplay(
      product.price,
      product.discountPrice
    );

    return (
      <div
        ref={ref}
        className={cn("product-item flex h-full max-w-full flex-col", className)}
      >
        <figure className="image-container relative mx-auto mb-3 aspect-square w-full max-w-full overflow-hidden rounded-xl bg-white">
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

          {/* Compare toggle sits on the image rather than in the button row,
              which is already at capacity on small screens.

              A product from another category is marked rather than disabled:
              disabling it would strand the shopper with no way to reach the
              "Clear & add this instead" action, and would look broken next to
              a fully enabled grid of identical cards. The muted ring plus the
              tooltip says why, and the click still explains it in a toast. */}
          <button
            onClick={() => compareToggle(compareProduct)}
            title={compareBlocked ? compareBlocked.message : undefined}
            className={cn(
              "absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 backdrop-blur transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isInCompare
                ? "text-primary ring-primary"
                : compareBlocked
                  ? "text-muted-400 ring-muted-200"
                  : "text-dark ring-muted-200"
            )}
            aria-label={
              isInCompare
                ? `Remove ${product.name} from compare`
                : compareBlocked
                  ? compareBlocked.message
                  : `Add ${product.name} to compare`
            }
            aria-pressed={isInCompare}
          >
            <GitCompareArrows size={15} className="shrink-0" />
          </button>
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
              {original !== null && (
                <del className="text-xs text-muted-500 sm:text-sm">
                  {formatPrice(original)}
                </del>
              )}
              <span className="text-base font-semibold text-dark sm:text-lg">
                {formatPrice(price)}
              </span>
              {discountPercent > 0 && (
                <span className="rounded-none border border-muted-300 px-1 py-0.5 text-[10px] font-normal leading-none text-muted-600">
                  {discountPercent}% OFF
                </span>
              )}
              {product.badge && (
                <span className="rounded-none border border-muted-300 px-1 py-0.5 text-[10px] font-normal leading-none text-muted-600">
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

            <div className="button-area w-full pb-1 pt-3.5 lg:px-0 lg:pb-3">
              <div className="flex items-stretch gap-1.5 sm:gap-2">
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={product.stockQuantity ?? 99}
                  disabled={product.stockQuantity != null && product.stockQuantity <= 0}
                  className="h-11 w-[96px] shrink-0 rounded-full border-muted-200 md:h-9 md:w-[86px] [&>button]:h-full [&>button]:w-9 [&>button]:rounded-full md:[&>button]:w-7 [&>input]:h-full [&>input]:w-[28px] md:[&>input]:w-[24px] [&>input]:border-muted-200"
                />
                <button
                  onClick={() => addToCart(product, quantity)}
                  className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1 rounded-full bg-primary px-2 md:h-9 text-xs font-medium text-white transition-all duration-200 hover:bg-primary-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label={`Add ${product.name} to cart`}
                  disabled={product.stockQuantity != null && product.stockQuantity <= 0}
                >
                  <ShoppingCart size={15} className="shrink-0" />
                  <span className="truncate">Add to Cart</span>
                </button>
                <button
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dark text-dark transition-all duration-200 hover:bg-dark hover:text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:h-9 md:w-9"
                  aria-label={`Quick view ${product.name}`}
                  onClick={() => setQuickViewOpen(true)}
                >
                  <Eye size={15} className="shrink-0" />
                </button>
                <button
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dark text-dark transition-all duration-200 hover:bg-dark hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 md:h-9 md:w-9"
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
                    <Check size={15} className="shrink-0 text-primary" />
                  ) : (
                    <Heart size={15} className="shrink-0" />
                  )}
                </button>
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
