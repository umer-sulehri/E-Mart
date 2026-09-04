'use client';

import * as React from 'react';
import { ShoppingCart, Heart, Share2, Truck, ShieldCheck, RotateCcw, GitCompareArrows } from 'lucide-react';
import toast from 'react-hot-toast';
import StarRating from '@/components/ui/StarRating';
import QuantitySelector from '@/components/ui/QuantitySelector';
import Button from '@/components/ui/Button';
import StockStatusIndicator from '@/components/ui/StockStatusIndicator';
import SellerInformationCard from '@/components/seller/SellerInformationCard';
import { formatPrice, cn } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useCompareStore } from '@/store/compareStore';
import { useAddToWishlist } from '@/hooks/useAddToWishlist';
import type { Product } from '@/types';

export interface ProductDetailClientProps {
  product: Product;
  hasDiscount: boolean;
  discount: number;
}

export default function ProductDetailClient({
  product,
  hasDiscount,
  discount,
}: ProductDetailClientProps) {
  const [quantity, setQuantity] = React.useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const addToServer = useCartStore((s) => s.addToServer);
  const compareItems = useCompareStore((s) => s.items);
  const addCompare = useCompareStore((s) => s.addItem);
  const removeCompare = useCompareStore((s) => s.removeItem);
  const { isWishlisted, toggleWishlist, wishlistLoading } = useAddToWishlist(
    product.id,
    product.name
  );

  const isCompared = compareItems.some((i) => i.id === product.id);

  const handleAddToCompare = () => {
    if (isCompared) {
      removeCompare(product.id);
      toast.success('Removed from compare');
      return;
    }
    if (compareItems.length >= 4) {
      toast.error('You can compare up to 4 products');
      return;
    }
    addCompare({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discountPrice: product.discountPrice,
      rating: product.rating,
      reviewCount: product.reviewCount,
      image: product.images?.[0] || '/images/product-thumb-1.webp',
      category: product.category?.name || '',
      brand: product.brand?.name || '',
      inStock: product.stockQuantity > 0,
    });
    toast.success('Added to compare');
  };

  const handleAddToCart = () => {
    const price = hasDiscount ? product.discountPrice! : product.price;

    addItem({
      id: `cart-${product.id}-${Date.now()}`,
      productId: product.id,
      product,
      quantity,
      unitPrice: price,
      totalPrice: price * quantity,
      addedAt: new Date().toISOString(),
    });

    addToServer(product.id, quantity);

    toast.success(`${product.name} added to cart!`);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: product.name,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Brand */}
      {product.brand && (
        <span className="text-sm font-medium text-primary">
          {product.brand.name}
        </span>
      )}

      {/* Product Name */}
      <h1 className="font-heading text-2xl font-bold text-secondary-800 lg:text-3xl">
        {product.name}
      </h1>

      {/* Rating */}
      <div className="flex items-center gap-3">
        <StarRating rating={product.rating} size="md" showValue />
        <span className="text-sm text-muted-500">
          {product.reviewCount} reviews
        </span>
        <a
          href="#tab-reviews"
          onClick={(e) => {
            e.preventDefault();
            document
              .getElementById('tab-reviews')
              ?.scrollIntoView({ behavior: 'smooth' });
            document.querySelectorAll('.tab-btn').forEach((btn) => {
              btn.classList.remove('border-primary', 'text-primary', 'font-semibold');
              btn.classList.add('border-transparent', 'text-muted-600', 'font-medium');
            });
            const reviewTab = document.querySelector('[data-tab="reviews"]');
            if (reviewTab) {
              reviewTab.classList.add('border-primary', 'text-primary', 'font-semibold');
              reviewTab.classList.remove('border-transparent', 'text-muted-600', 'font-medium');
            }
            document.querySelectorAll('.tab-content').forEach((el) => el.classList.add('hidden'));
            document.getElementById('tab-reviews')?.classList.remove('hidden');
          }}
          className="text-sm font-medium text-primary transition-colors hover:text-primary-500"
        >
          Write a Review
        </a>
      </div>

      {/* Price */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-2xl font-bold text-secondary-800">
          {formatPrice(hasDiscount ? product.discountPrice! : product.price)}
        </span>
        {hasDiscount && (
          <>
            <del className="text-lg text-muted-500">
              {formatPrice(product.price)}
            </del>
            <span className="rounded-full bg-danger-100 px-2.5 py-1 text-xs font-semibold text-danger-700">
              {discount}% OFF
            </span>
          </>
        )}
      </div>

      {/* Short Description */}
      {product.shortDescription && (
        <p className="text-sm leading-relaxed text-muted-600">
          {product.shortDescription}
        </p>
      )}

      {/* Divider */}
      <div className="border-t border-muted-100" />

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-600">Availability:</span>
        <StockStatusIndicator stock={product.stockQuantity} showQuantity />
      </div>

      {/* Quantity + Add to Cart + Wishlist */}
      <div className="flex flex-wrap items-center gap-3">
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={product.stockQuantity}
          disabled={product.stockQuantity <= 0}
        />
        <Button
          variant="primary"
          size="lg"
          onClick={handleAddToCart}
          disabled={product.stockQuantity <= 0}
          className="flex-1 sm:flex-none"
        >
          <ShoppingCart size={18} />
          Add to Cart
        </Button>
        <Button
          variant={isWishlisted ? 'danger' : 'outline'}
          size="lg"
          onClick={toggleWishlist}
          disabled={wishlistLoading}
          className={cn(isWishlisted && 'bg-danger-50')}
        >
          <Heart size={18} className={cn(isWishlisted && 'fill-current')} />
        </Button>
        <Button variant="ghost" size="lg" onClick={handleShare}>
          <Share2 size={18} />
        </Button>
        <Button
          variant={isCompared ? 'outline' : 'ghost'}
          size="lg"
          onClick={handleAddToCompare}
          aria-label={isCompared ? 'Remove from compare' : 'Add to compare'}
        >
          <GitCompareArrows
            size={18}
            className={cn(isCompared && 'text-primary')}
          />
        </Button>
      </div>

      {/* Divider */}
      <div className="border-t border-muted-100" />

      {/* SKU & Category */}
      <div className="space-y-2 text-sm">
        <div className="flex gap-2">
          <span className="font-medium text-secondary-700">SKU:</span>
          <span className="text-muted-600">{product.sku}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-medium text-secondary-700">Category:</span>
          <a
            href={`/products?category=${product.category.slug}`}
            className="text-primary transition-colors hover:text-primary-500"
          >
            {product.category.name}
          </a>
        </div>
        {product.brand && (
          <div className="flex gap-2">
            <span className="font-medium text-secondary-700">Brand:</span>
            <span className="text-muted-600">{product.brand.name}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-muted-100" />

      {/* Sold by */}
      {product.vendor?.id && (
        <SellerInformationCard
          seller={{
            id: product.vendor.id,
            name: product.vendor.name,
            slug: product.vendor.slug,
            rating: product.vendor.rating ?? 0,
            totalSales: product.vendor.totalSales ?? 0,
            joinedDate: product.vendor.createdAt
              ? new Date(product.vendor.createdAt).toLocaleDateString()
              : '',
            isVerified: product.vendor.status === 'approved',
          }}
        />
      )}

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary">
            <Truck size={20} />
          </div>
          <span className="text-xs font-medium text-secondary-700">
            Free Delivery
          </span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary">
            <ShieldCheck size={20} />
          </div>
          <span className="text-xs font-medium text-secondary-700">
            Secure Payment
          </span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary">
            <RotateCcw size={20} />
          </div>
          <span className="text-xs font-medium text-secondary-700">
            Easy Returns
          </span>
        </div>
      </div>
    </div>
  );
}
