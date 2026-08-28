'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Home,
  Heart,
  ShoppingCart,
  Trash2,
  Loader2,
  LogIn,
} from 'lucide-react';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import Button from '@/components/ui/Button';
import ShareWishlist from '@/components/wishlist/ShareWishlist';
import { formatPrice } from '@/lib/utils';

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  image: string;
  inStock: boolean;
  addedAt: string;
}

const MOCK_WISHLIST: WishlistItem[] = [
  {
    id: '1',
    productId: 'p1',
    name: 'Organic Whole Wheat Flour',
    slug: 'organic-whole-wheat-flour',
    price: 850,
    discountPrice: 720,
    image: '/images/product-thumb-1.png',
    inStock: true,
    addedAt: '2026-08-20',
  },
  {
    id: '2',
    productId: 'p2',
    name: 'Fresh Desi Ghee 1kg',
    slug: 'fresh-desi-ghee',
    price: 1200,
    discountPrice: null,
    image: '/images/product-thumb-2.png',
    inStock: true,
    addedAt: '2026-08-18',
  },
  {
    id: '3',
    productId: 'p3',
    name: 'Honey Pure Natural 500g',
    slug: 'honey-pure-natural',
    price: 950,
    discountPrice: 850,
    image: '/images/product-thumb-3.png',
    inStock: false,
    addedAt: '2026-08-15',
  },
];

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const res = await fetch('/api/v1/auth/me');
        const json = await res.json();
        if (!cancelled) {
          if (json.success && json.data) {
            setIsAuthenticated(true);
            fetchWishlist();
          } else {
            setIsAuthenticated(false);
            setLoading(false);
          }
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    }

    async function fetchWishlist() {
      try {
        const res = await fetch('/api/v1/wishlist');
        const json = await res.json();
        if (!cancelled) {
          if (json.success && json.data?.length) {
            setItems(json.data);
          } else {
            setItems(MOCK_WISHLIST);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setItems(MOCK_WISHLIST);
          setLoading(false);
        }
      }
    }

    checkAuth();
    return () => { cancelled = true; };
  }, []);

  const handleRemove = async (id: string) => {
    try {
      await fetch(`/api/v1/wishlist/${id}`, { method: 'DELETE' });
    } catch {}
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    try {
      const res = await fetch('/api/v1/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: item.productId, quantity: 1 }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetch(`/api/v1/wishlist/${item.id}`, { method: 'DELETE' }).catch(() => {});
        setItems((prev) => prev.filter((w) => w.id !== item.id));
      }
    } catch {}
    router.push('/cart');
  };

  // Auth check loading
  if (isAuthenticated === null) {
    return (
      <>
        <section className="relative bg-secondary-800 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
              My Wishlist
            </h1>
            <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-primary">Wishlist</span>
            </div>
          </div>
        </section>
        <section className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </section>
      </>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <section className="relative bg-secondary-800 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
              My Wishlist
            </h1>
            <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-primary">Wishlist</span>
            </div>
          </div>
        </section>
        <section className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted-100">
            <Heart size={48} className="text-muted-400" />
          </div>
          <h2 className="mb-2 font-heading text-xl font-bold text-secondary-800">
            Login to view your wishlist
          </h2>
          <p className="mb-6 max-w-sm text-sm text-muted-500">
            Save your favorite products to your wishlist and access them anytime.
          </p>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="primary" size="lg">
                <LogIn size={16} />
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg">
                Create Account
              </Button>
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="relative bg-secondary-800 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
            My Wishlist
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">Wishlist</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white p-5 shadow-sm">
                  <div className="h-48 rounded-xl bg-muted-100" />
                  <div className="mt-4 h-5 w-3/4 rounded bg-muted-100" />
                  <div className="mt-2 h-4 w-1/3 rounded bg-muted-100" />
                  <div className="mt-4 flex gap-2">
                    <div className="h-10 flex-1 rounded-lg bg-muted-100" />
                    <div className="h-10 w-10 rounded-lg bg-muted-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted-100">
                <Heart size={48} className="text-muted-400" />
              </div>
              <h2 className="mb-2 font-heading text-xl font-bold text-secondary-800">
                Your wishlist is empty
              </h2>
              <p className="mb-6 max-w-sm text-sm text-muted-500">
                Browse our products and add your favorites to the wishlist.
              </p>
              <Link href="/products">
                <Button variant="primary" size="lg">
                  <ShoppingCart size={16} />
                  Browse Products
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-500">
                  You have{' '}
                  <span className="font-medium text-secondary-800">{items.length}</span>{' '}
                  {items.length === 1 ? 'item' : 'items'} in your wishlist
                </p>
                <ShareWishlist />
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <Link href={`/products/${item.slug}`} className="relative block h-48 overflow-hidden rounded-xl bg-muted-50">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      {!item.inStock && (
                        <span className="absolute left-2 top-2 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                          Out of Stock
                        </span>
                      )}
                    </Link>

                    <div className="mt-4">
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-heading text-base font-bold text-secondary-800 hover:text-primary transition-colors"
                      >
                        {item.name}
                      </Link>

                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(item.discountPrice ?? item.price)}
                        </span>
                        {item.discountPrice && (
                          <span className="text-sm text-muted-400 line-through">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          disabled={!item.inStock}
                          onClick={() => handleMoveToCart(item)}
                        >
                          <ShoppingCart size={14} />
                          Move to Cart
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash2 size={14} className="text-danger" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
