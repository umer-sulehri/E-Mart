'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { mockBlogPosts } from '@/lib/mock/blog';
import { useTranslations } from '@/hooks/useTranslations';
import { useCartStore } from '@/lib/store/cartStore';
import { StarIcon, ArrowLeftIcon, ArrowRightIcon, TruckIcon, ClockIcon, CheckCircleIcon, ShoppingCartIcon } from '@/components/icons';
import type { Product } from '@/lib/types';

const banners = [
  { id: 1, title: 'Fresh Fruits & Vegetables', subtitle: 'Up to 30% off on organic produce', bg: 'bg-primary/10', accent: 'bg-primary', img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&h=400&fit=crop' },
  { id: 2, title: 'Daily Essentials', subtitle: 'Stock up on groceries at best prices', bg: 'bg-accent/10', accent: 'bg-accent', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop' },
  { id: 3, title: 'Household Deals', subtitle: 'Save big on cleaning & kitchen items', bg: 'bg-secondary/30', accent: 'bg-secondary', img: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&h=400&fit=crop' },
];

const brands = [
  { id: 'b1', name: 'Nestle', color: '#E4002B' },
  { id: 'b2', name: 'Unilever', color: '#1F36C7' },
  { id: 'b3', name: 'PEPSI', color: '#004B93' },
  { id: 'b4', name: 'Coca Cola', color: '#F40009' },
  { id: 'b5', name: 'Dalda', color: '#00843D' },
  { id: 'b6', name: 'Mitchell\'s', color: '#C8102E' },
  { id: 'b7', name: 'Tapal', color: '#8B0000' },
  { id: 'b8', name: 'Shan', color: '#DAA520' },
];

const popularSearches = ['Rice', 'Milk', 'Bread', 'Eggs', 'Chicken', 'Apples', 'Tea', 'Oil', 'Sugar', 'Flour', 'Soap', 'Detergent'];

export default function HomePage() {
  const { t, locale } = useTranslations();
  const addItem = useCartStore((s) => s.addItem);
  const [activeBanner, setActiveBanner] = useState(0);
  const [trendingTab, setTrendingTab] = useState('all');

  const scrollRef = useRef<HTMLDivElement>(null);
  const brandScrollRef = useRef<HTMLDivElement>(null);
  const bestSellingRef = useRef<HTMLDivElement>(null);
  const popularRef = useRef<HTMLDivElement>(null);
  const newArrivalsRef = useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
    if (!ref.current) return;
    const amount = dir === 'left' ? -300 : 300;
    ref.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const { data: allProductsData } = useProducts({}, 1, 50);
  const { data: categories } = useCategories();
  const allProducts = allProductsData?.products ?? [];

  const trendingProducts = allProducts.filter((p) => {
    if (trendingTab === 'all') return true;
    if (trendingTab === 'fruits') return p.tags?.includes('organic') || p.tags?.includes('fresh');
    if (trendingTab === 'vegetables') return p.tags?.includes('fresh');
    if (trendingTab === 'groceries') return p.tags?.includes('staple') || p.tags?.includes('cooking');
    return true;
  });

  const bestSelling = allProducts.filter((p) => p.rating >= 4.3).slice(0, 8);
  const popular = [...allProducts].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8);
  const justArrived = allProducts.filter((p) => p.isNew);

  return (
    <div>
      {/* Hero Banner Carousel */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="relative rounded-[16px] overflow-hidden bg-surface">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${activeBanner * 100}%)` }}>
              {banners.map((banner, i) => (
                <div key={banner.id} className="min-w-full relative">
                  <div className="flex flex-col md:flex-row items-center gap-6 p-8 md:p-12 min-h-[280px] md:min-h-[360px]">
                    <div className="flex-1 z-10">
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-text-primary mb-3 leading-tight">{banner.title}</h2>
                      <p className="text-base text-text-secondary mb-6">{banner.subtitle}</p>
                      <div className="flex gap-3">
                        <Link href="/products" className="inline-flex items-center justify-center h-[48px] px-6 bg-primary text-text-inverse font-semibold rounded-[10px] hover:bg-primary-dark transition-colors">
                          {t('home.hero.shopNow')}
                        </Link>
                        <Link href="/products" className="inline-flex items-center justify-center h-[48px] px-6 border-2 border-text-primary/20 text-text-primary font-semibold rounded-[10px] hover:border-text-primary/40 transition-colors">
                          {t('home.hero.explore')}
                        </Link>
                      </div>
                    </div>
                    <div className="flex-1 hidden md:block">
                      <img src={banner.img} alt={banner.title} className="w-full h-[240px] object-cover rounded-[12px]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBanner(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`w-3 h-3 rounded-full transition-all ${i === activeBanner ? 'bg-primary w-8' : 'bg-text-secondary/30 hover:bg-text-secondary/50'}`}
                />
              ))}
            </div>
            {/* Arrows */}
            <button onClick={() => setActiveBanner((prev) => (prev === 0 ? banners.length - 1 : prev - 1))} aria-label="Previous slide" className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-bg/80 hover:bg-bg rounded-full flex items-center justify-center z-20 transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <button onClick={() => setActiveBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1))} aria-label="Next slide" className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-bg/80 hover:bg-bg rounded-full flex items-center justify-center z-20 transition-colors">
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: <TruckIcon className="w-6 h-6" />, title: t('home.features.freeDelivery'), desc: t('home.features.freeDeliveryDesc') },
            { icon: <ClockIcon className="w-6 h-6" />, title: t('home.features.customerSupport'), desc: t('home.features.customerSupportDesc') },
            { icon: <CheckCircleIcon className="w-6 h-6" />, title: t('home.features.securePayment'), desc: t('home.features.securePaymentDesc') },
            { icon: <CheckCircleIcon className="w-6 h-6" />, title: t('home.features.qualityGuarantee'), desc: t('home.features.qualityGuaranteeDesc') },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-surface rounded-[12px] border border-border">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-primary/10 text-primary rounded-full">{f.icon}</div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{f.title}</p>
                <p className="text-xs text-text-secondary">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Carousel */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary">{t('home.shopByCategory')}</h2>
          <Link href="/products" className="text-sm font-semibold text-primary-dark hover:underline">{t('home.categories.viewAll')}</Link>
        </div>
        <div className="relative group">
          <button onClick={() => scroll(scrollRef, 'left')} aria-label="Scroll left" className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-12 h-12 bg-bg border border-border shadow-sm rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-alt">
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2" style={{ scrollbarWidth: 'none' }}>
            {(categories ?? []).map((cat) => (
              <Link key={cat.id} href={`/categories/${cat.slug}`} className="flex-shrink-0 snap-start">
                <div className="w-[140px] h-[160px] bg-surface border border-border rounded-[12px] flex flex-col items-center justify-center gap-3 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                  <span className="text-4xl group-hover:scale-110 transition-transform" role="img" aria-label={cat.name}>{cat.icon || '📦'}</span>
                  <span className="text-sm font-semibold text-text-primary text-center px-2">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
          <button onClick={() => scroll(scrollRef, 'right')} aria-label="Scroll right" className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-12 h-12 bg-bg border border-border shadow-sm rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-alt">
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Trending Products with Tabs */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-xl font-bold text-text-primary">{t('home.trending')}</h2>
          <div className="flex gap-2">
            {(['all', 'fruits', 'vegetables', 'groceries'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTrendingTab(tab)}
                aria-label={`Filter by ${t(`home.trending.${tab}`)}`}
                aria-pressed={trendingTab === tab}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors min-h-[48px] ${
                  trendingTab === tab ? 'bg-primary text-text-inverse' : 'bg-surface border border-border text-text-secondary hover:bg-surface-alt'
                }`}
              >
                {t(`home.trending.${tab}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {trendingProducts.slice(0, 10).map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={addItem} />
          ))}
        </div>
      </section>

      {/* Product Carousel: Best Selling */}
      <ProductCarousel title={t('home.bestSelling')} viewAllText={t('home.viewAll')} ref={bestSellingRef} products={bestSelling} onAddToCart={addItem} onScroll={scroll} />

      {/* Brands Carousel */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <h2 className="text-xl font-bold text-text-primary mb-4">{t('home.brands')}</h2>
        <div className="relative group">
          <button onClick={() => scroll(brandScrollRef, 'left')} aria-label="Scroll left" className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-12 h-12 bg-bg border border-border shadow-sm rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-alt">
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div ref={brandScrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2" style={{ scrollbarWidth: 'none' }}>
            {brands.map((brand) => (
              <div key={brand.id} className="flex-shrink-0 snap-start w-[140px] h-[80px] bg-surface border border-border rounded-[12px] flex items-center justify-center hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                <span className="text-sm font-bold" style={{ color: brand.color }}>{brand.name}</span>
              </div>
            ))}
          </div>
          <button onClick={() => scroll(brandScrollRef, 'right')} aria-label="Scroll right" className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-12 h-12 bg-bg border border-border shadow-sm rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-alt">
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Product Carousel: Popular */}
      <ProductCarousel title={t('home.popular')} viewAllText={t('home.viewAll')} ref={popularRef} products={popular} onAddToCart={addItem} onScroll={scroll} />

      {/* Just Arrived */}
      <ProductCarousel title={t('home.justArrived')} viewAllText={t('home.viewAll')} ref={newArrivalsRef} products={justArrived} onAddToCart={addItem} onScroll={scroll} />

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <div className="bg-primary/10 border border-primary/20 rounded-[16px] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-text-primary mb-2">{t('home.newsletter.title')}</h2>
            <p className="text-text-secondary">{t('home.newsletter.subtitle')}</p>
          </div>
          <div className="flex-1 w-full max-w-md">
            <div className="flex gap-2">
              <input type="email" placeholder={t('home.newsletter.placeholder')} aria-label={t('home.newsletter.placeholder')} className="flex-1 h-[48px] px-4 bg-bg border border-border rounded-[10px] text-base text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors" />
              <button className="h-[48px] px-6 bg-primary text-text-inverse font-semibold rounded-[10px] hover:bg-primary-dark transition-colors whitespace-nowrap">
                {t('home.newsletter.subscribe')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-text-primary">{t('home.blog.title')}</h2>
          <Link href="/blog" className="text-sm font-semibold text-primary-dark hover:underline">{t('home.viewAll')}</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mockBlogPosts.slice(0, 6).map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="block h-full">
              <article className="bg-surface border border-border rounded-[12px] overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  <span className="absolute top-3 left-3 bg-primary/90 text-text-inverse text-xs font-semibold px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex items-center gap-1 text-xs text-text-secondary">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {post.readTime} min read
                    </span>
                    <span className="text-xs text-text-secondary">
                      {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-text-primary mb-2 line-clamp-2 group-hover:text-primary-dark transition-colors">{post.title}</h3>
                  <p className="text-sm text-text-secondary line-clamp-2 mb-3 flex-1">{post.excerpt}</p>
                  <span className="text-sm font-semibold text-primary-dark">{t('home.blog.readMore')}</span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Searches */}
      <section className="max-w-7xl mx-auto px-4 mb-10">
        <h2 className="text-xl font-bold text-text-primary mb-4">{t('home.popularSearches')}</h2>
        <div className="flex flex-wrap gap-2">
          {popularSearches.map((term) => (
            <Link key={term} href={`/products?search=${encodeURIComponent(term)}`}>
              <span className="px-4 py-2 bg-surface border border-border rounded-full text-sm font-medium text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors cursor-pointer">
                {term}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (product: Product, quantity?: number) => void }) {
  const handleAdd = () => {
    onAddToCart(product, 1);
  };

  return (
    <div className="bg-surface border border-border rounded-[12px] overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] bg-surface-alt overflow-hidden">
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          {product.originalPrice && (
            <span className="absolute top-2 left-2 bg-error text-text-inverse text-xs font-bold px-2 py-1 rounded-full">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </span>
          )}
          {product.isNew && (
            <span className="absolute top-2 right-2 bg-success text-text-inverse text-xs font-bold px-2 py-1 rounded-full">NEW</span>
          )}
        </div>
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-semibold text-text-primary mb-1 line-clamp-2 hover:text-primary-dark transition-colors">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1 mb-2">
          <StarIcon className="w-4 h-4 text-warning" filled />
          <span className="text-xs text-text-secondary">{product.rating} ({product.reviewCount})</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base font-bold text-text-primary">Rs {product.price.toLocaleString()}</span>
          {product.originalPrice && (
            <span className="text-xs text-text-secondary line-through">Rs {product.originalPrice.toLocaleString()}</span>
          )}
        </div>
        <button onClick={handleAdd} className="mt-auto w-full min-h-[48px] flex items-center justify-center gap-2 bg-primary text-text-inverse text-sm font-semibold rounded-[10px] hover:bg-primary-dark transition-colors">
          <ShoppingCartIcon className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}

const ProductCarousel = ({ title, viewAllText, ref: scrollRef, products, onAddToCart, onScroll }: {
  title: string;
  viewAllText: string;
  ref: React.RefObject<HTMLDivElement | null>;
  products: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onScroll: (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => void;
}) => (
  <section className="max-w-7xl mx-auto px-4 mb-10">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-text-primary">{title}</h2>
      <Link href="/products" className="text-sm font-semibold text-primary-dark hover:underline">{viewAllText}</Link>
    </div>
    <div className="relative group">
      <button onClick={() => onScroll(scrollRef, 'left')} aria-label="Scroll left" className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-12 h-12 bg-bg border border-border shadow-sm rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-alt">
        <ArrowLeftIcon className="w-4 h-4" />
      </button>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2" style={{ scrollbarWidth: 'none' }}>
        {products.map((product) => (
          <div key={product.id} className="flex-shrink-0 snap-start w-[220px]">
            <ProductCard product={product} onAddToCart={onAddToCart} />
          </div>
        ))}
      </div>
      <button onClick={() => onScroll(scrollRef, 'right')} aria-label="Scroll right" className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-12 h-12 bg-bg border border-border shadow-sm rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-alt">
        <ArrowRightIcon className="w-4 h-4" />
      </button>
    </div>
  </section>
);
