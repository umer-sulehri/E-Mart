'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Heart, Share2, Truck, ShieldCheck, RotateCcw, GitCompareArrows, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import StarRating from '@/components/ui/StarRating';
import QuantitySelector from '@/components/ui/QuantitySelector';
import Button from '@/components/ui/Button';
import StockStatusIndicator from '@/components/ui/StockStatusIndicator';
import SellerInformationCard from '@/components/seller/SellerInformationCard';
import { formatPrice, cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { useCartStore } from '@/store/cartStore';
import { useCompareStore } from '@/store/compareStore';
import { useAuthStore } from '@/store/authStore';
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
  const [addingToCart, setAddingToCart] = React.useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const addToServer = useCartStore((s) => s.addToServer);
  const compareItems = useCompareStore((s) => s.items);
  const addCompare = useCompareStore((s) => s.addItem);
  const removeCompare = useCompareStore((s) => s.removeItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();
  const { isWishlisted, toggleWishlist, wishlistLoading } = useAddToWishlist(
    product.id,
    product.name,
    { isAuthenticated }
  );

  const isCompared = compareItems.some((i) => i.id === product.id);

  // Keep the /compare deep link (?products=slug1,slug2) shareable by syncing
  // the URL whenever the persisted compare list changes.
  const syncCompareUrl = (items: { slug: string }[]) => {
    if (items.length === 0) {
      router.replace('/compare', { scroll: false });
    } else {
      const slugs = items
        .map((i) => i.slug)
        .filter(Boolean)
        .join(',');
      router.replace(`/compare?products=${slugs}`, { scroll: false });
    }
  };

  const handleAddToCompare = () => {
    if (isCompared) {
      const remaining = compareItems.filter((i) => i.id !== product.id);
      removeCompare(product.id);
      syncCompareUrl(remaining);
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
    syncCompareUrl([...compareItems, { slug: product.slug }]);
    trackEvent({ action: 'compare_add', category: 'product', label: product.slug });
    toast.success('Added to compare');
  };

  const handleAddToCart = async () => {
    const price = hasDiscount ? product.discountPrice! : product.price;

    if (product.stockQuantity <= 0) {
      toast.error('This product is out of stock');
      return;
    }

    setAddingToCart(true);
    try {
      addItem({
        id: `cart-${product.id}-${Date.now()}`,
        productId: product.id,
        product,
        quantity,
        unitPrice: price,
        totalPrice: price * quantity,
        addedAt: new Date().toISOString(),
      });

      await addToServer(product.id, quantity);

      toast.success(`${product.name} added to cart!`);
    } finally {
      setAddingToCart(false);
    }
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

  const openReviewsTab = () => {
    window.dispatchEvent(new CustomEvent('emart:open-reviews'));
  };

  const handleWriteReviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      openReviewsTab();
    } else {
      trackEvent({ action: 'cta_click', category: 'review', label: 'sign-in-to-review' });
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  };

  // Sticky "Add to Cart": once the inline CTA scrolls out of view on small
  // screens, surface a fixed bottom bar so the purchase action stays reachable.
  const inlineCtaRef = React.useRef<HTMLDivElement>(null);
  const [stickyVisible, setStickyVisible] = React.useState(false);

  React.useEffect(() => {
    const el = inlineCtaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -80px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleStickyAddToCart = () => {
    if (product.stockQuantity <= 0) {
      toast.error('This product is out of stock');
      return;
    }
    setAddingToCart(true);
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
    addToServer(product.id, quantity).finally(() => {
      setAddingToCart(false);
      toast.success(`${product.name} added to cart!`);
    });
  };

  const priceDisplay = formatPrice(
    hasDiscount ? product.discountPrice! : product.price
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Category + Brand / Store (clickable meta shown above the title) */}
      {(product.category?.name || product.brand?.name || (product.vendor?.name && product.vendor.slug)) && (
        <nav
          className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm"
          aria-label="Product category and brand"
        >
          {product.category?.name && product.category.slug && (
            <Link
              href={`/products?category=${encodeURIComponent(product.category.slug)}`}
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 font-bold text-primary transition-colors hover:bg-primary-100 hover:text-primary-700"
            >
              <Tag size={13} />
              {product.category.name}
            </Link>
          )}
          {product.brand?.name && (
            <>
              <span className="text-muted-300" aria-hidden="true">
                •
              </span>
              <Link
                href={`/products?brands=${encodeURIComponent(product.brand.name)}`}
                className="font-bold text-primary transition-colors hover:text-primary-500"
              >
                {product.brand.name}
              </Link>
            </>
          )}
          {product.vendor?.name && product.vendor.slug && (
            <>
              <span className="text-muted-300" aria-hidden="true">
                •
              </span>
              <Link
                href={`/sellers/${product.vendor.slug}`}
                className="font-bold text-primary transition-colors hover:text-primary-500"
              >
                {product.vendor.name}
              </Link>
            </>
          )}
        </nav>
      )}

      {/* Product Name */}
      <h1 className="font-heading text-2xl font-bold text-secondary-800 lg:text-3xl">
        {product.name}
      </h1>

      {/* Rating + review CTA */}
      <div className="flex flex-wrap items-center gap-3">
        <StarRating rating={product.rating} size="md" showValue />
        <span className="text-sm text-muted-500">{product.reviewCount} reviews</span>
        <a
          href={isAuthenticated ? '#reviews' : `/login?redirect=${encodeURIComponent(pathname)}`}
          onClick={handleWriteReviewClick}
          className="text-sm font-medium text-primary transition-colors hover:text-primary-500"
        >
          {isAuthenticated ? 'Write a Review' : 'Sign in to Review'}
        </a>
      </div>

      {/* Sold by — shown above price so buyers see the store context early */}
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

      {/* Price + Stock */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-2xl font-bold text-secondary-800">{priceDisplay}</span>
        {hasDiscount && (
          <>
            <del className="text-lg text-muted-500">{formatPrice(product.price)}</del>
            <span className="rounded-full bg-danger-100 px-2.5 py-1 text-xs font-semibold text-danger-700">
              {discount}% OFF
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-600">Availability:</span>
        <StockStatusIndicator stock={product.stockQuantity} showQuantity />
      </div>

      {/* Short Description */}
      {product.shortDescription && (
        <p className="text-sm leading-relaxed text-muted-600">
          {product.shortDescription}
        </p>
      )}

      {/* Divider */}
      <div className="border-t border-muted-100" />

      {/* Quantity + Add to Cart + Wishlist + Compare + Share (equal-spaced grid) */}
      <div ref={inlineCtaRef} className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <div className="col-span-2 flex items-center justify-center lg:col-span-1">
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={product.stockQuantity}
            disabled={product.stockQuantity <= 0}
          />
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={handleAddToCart}
          disabled={product.stockQuantity <= 0 || addingToCart}
          loading={addingToCart}
          className="col-span-2 lg:col-span-2"
        >
          <ShoppingCart size={18} />
          Add to Cart
        </Button>
        <Button
          variant={isWishlisted ? 'danger' : 'outline'}
          size="lg"
          onClick={toggleWishlist}
          disabled={wishlistLoading}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={cn('col-span-1 lg:col-span-1', isWishlisted && 'bg-danger-50')}
        >
          <Heart size={18} className={cn(isWishlisted && 'fill-current')} />
        </Button>
        <Button
          variant={isCompared ? 'outline' : 'ghost'}
          size="lg"
          onClick={handleAddToCompare}
          aria-label={isCompared ? 'Remove from compare' : 'Add to compare'}
          title={isCompared ? 'Remove from compare' : 'Add to compare'}
          className="col-span-1 lg:col-span-1"
        >
          <GitCompareArrows
            size={18}
            className={cn(isCompared && 'text-primary')}
          />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={handleShare}
          aria-label="Share product"
          title="Share product"
          className="col-span-2 lg:col-span-1"
        >
          <Share2 size={18} />
        </Button>
      </div>

      {/* Divider */}
      <div className="border-t border-muted-100" />

      {/* SKU + Category (display-only badge below the product ID block) */}
      <div className="space-y-2 text-sm">
        <div className="flex gap-2">
          <span className="font-bold text-secondary-800">SKU:</span>
          <span className="text-muted-600">{product.sku}</span>
        </div>
        {product.category?.name && (
          <div className="flex gap-2">
            <span className="font-bold text-secondary-800">Category:</span>
            <span
              aria-disabled="true"
              title="Browse other categories from the link above"
              className="cursor-not-allowed rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-gray-700"
            >
              {product.category.name}
            </span>
          </div>
        )}
        {product.brand?.name && (
          <div className="flex gap-2">
            <span className="font-bold text-secondary-800">Brand:</span>
            <span className="text-muted-600">{product.brand.name}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-muted-100" />

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary">
            <Truck size={20} />
          </div>
          <span className="text-xs font-medium text-secondary-700">Free Delivery</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary">
            <ShieldCheck size={20} />
          </div>
          <span className="text-xs font-medium text-secondary-700">Secure Payment</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary">
            <RotateCcw size={20} />
          </div>
          <span className="text-xs font-medium text-secondary-700">Easy Returns</span>
        </div>
      </div>

      {/* Sticky Add to Cart (mobile) */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-muted-100 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm transition-transform duration-300 lg:hidden',
          stickyVisible ? 'translate-y-0' : 'translate-y-full'
        )}
        aria-hidden={!stickyVisible}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-500">{product.name}</p>
            <p className="text-lg font-bold text-secondary-800">{priceDisplay}</p>
          </div>
          <Button
            variant="primary"
            onClick={handleStickyAddToCart}
            disabled={product.stockQuantity <= 0 || addingToCart}
            loading={addingToCart}
            className="whitespace-nowrap"
          >
            <ShoppingCart size={16} />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}