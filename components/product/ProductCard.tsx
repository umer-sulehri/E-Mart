"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart, Eye, Check } from "lucide-react";
import StarRating from "@/components/ui/StarRating";
import QuickViewModal from "@/components/product/QuickViewModal";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useAddToWishlist } from "@/hooks/useAddToWishlist";
import { formatPrice, calculateDiscount, cn } from "@/lib/utils";

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
    const {
      isWishlisted,
      toggleWishlist,
      wishlistLoading,
    } = useAddToWishlist(product.id, product.name);
    const discount = product.discountPrice
      ? calculateDiscount(product.price, product.discountPrice)
      : 0;

    return (
      <div ref={ref} className={cn("product-item", className)}>
        <figure className="text-center">
          <Link href={`/products/${product.slug}`} title={product.name}>
            <Image
              src={product.image}
              alt={product.name}
              width={210}
              height={210}
              className="max-h-[210px] w-auto object-contain"
            />
          </Link>
        </figure>

        <div className="flex flex-col items-center text-center">
          <h3 className="text-base font-normal text-dark">
            {product.name}
          </h3>

          <div className="mt-1">
            <StarRating
              rating={product.rating}
              size="sm"
              reviewCount={product.reviewCount}
            />
          </div>

          <div className="mt-1 flex items-center justify-center gap-2">
            {product.discountPrice && (
              <del className="text-sm text-muted-500">
                {formatPrice(product.price)}
              </del>
            )}
            <span className="text-sm font-semibold text-dark">
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

          <div className="button-area p-3 pt-0">
            <div className="mt-2 flex items-center gap-1">
              <div className="w-3/12">
                <input
                  type="number"
                  name="quantity"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  min={1}
                  className="w-full rounded border border-dark-subtle p-2 text-sm"
                />
              </div>
              <div className="w-7/12">
                <button
                  onClick={() => addToCart(product, quantity)}
                  className="btn-cart flex w-full items-center justify-center gap-2 rounded-1 bg-primary p-2 text-xs text-white hover:bg-primary-500"
                  aria-label={`Add ${product.name} to cart`}
                >
                  <ShoppingCart size={16} />
                  Add to Cart
                </button>
              </div>
              <div className="w-2/12">
                <button
                  className="flex w-full items-center justify-center rounded-1 border border-dark p-2 text-dark hover:bg-dark hover:text-white"
                  aria-label={`Quick view ${product.name}`}
                  onClick={() => setQuickViewOpen(true)}
                >
                  <Eye size={16} />
                </button>
              </div>
              <div className="w-2/12">
                <button
                  className="flex w-full items-center justify-center rounded-1 border border-dark p-2 text-dark hover:bg-dark hover:text-white disabled:opacity-50"
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
                    <Check size={16} className="text-primary" />
                  ) : (
                    <Heart size={16} />
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
