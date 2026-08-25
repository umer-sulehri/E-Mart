'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Preloader from '@/components/layout/Preloader';
import HeroBanner from '@/components/home/HeroBanner';
import CategoryCarousel, {
  type CategoryItem,
} from '@/components/home/CategoryCarousel';
import BannerAds from '@/components/home/BannerAds';
import ProductCarousel from '@/components/product/ProductCarousel';
import Newsletter from '@/components/home/Newsletter';
import BlogSection from '@/components/home/BlogSection';
import DownloadApp from '@/components/home/DownloadApp';
import PopularTags from '@/components/home/PopularTags';
import TestimonialSection from '@/components/home/TestimonialSection';
import FeaturesStrip from '@/components/home/FeaturesStrip';
import ProductCard from '@/components/product/ProductCard';
import type { Product } from '@/components/product/ProductCard';
import {
  bestSellingProducts,
  featuredProducts,
  popularProducts,
  newArrivals,
} from '@/lib/mock/products';
import {
  api,
  apiProductToCardProduct,
  apiCategoryToCarouselCategory,
  type ApiProduct,
  type ApiCategory,
  type ApiListResponse,
} from '@/lib/api';

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="mb-4">
          <div className="animate-pulse rounded-2xl bg-white p-3 text-center shadow-sm">
            <div className="mx-auto h-[210px] w-[210px] rounded-lg bg-muted-100" />
            <div className="mt-3 mx-auto h-4 w-3/4 rounded bg-muted-100" />
            <div className="mt-2 mx-auto h-3 w-1/2 rounded bg-muted-100" />
            <div className="mt-2 mx-auto h-4 w-1/3 rounded bg-muted-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonCarousel() {
  return (
    <div className="flex gap-6 overflow-hidden py-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="min-w-[200px] flex-shrink-0 animate-pulse">
          <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
            <div className="mx-auto h-[210px] w-[210px] rounded-lg bg-muted-100" />
            <div className="mt-3 mx-auto h-4 w-3/4 rounded bg-muted-100" />
            <div className="mt-2 mx-auto h-3 w-1/2 rounded bg-muted-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [bestSellers, setBestSellers] = useState<Product[]>(bestSellingProducts);
  const [featured, setFeatured] = useState<Product[]>(featuredProducts);
  const [popular, setPopular] = useState<Product[]>(popularProducts);
  const [newArrivalsProducts, setNewArrivalsProducts] =
    useState<Product[]>(newArrivals);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [bestRes, featuredRes, popularRes, newRes, catRes] =
          await Promise.allSettled([
            api.products.list({ sort: 'popular', limit: '8', status: 'active' }),
            api.products.list({ sort: 'rating', limit: '8', status: 'active' }),
            api.products.list({ sort: 'popular', limit: '8', status: 'active' }),
            api.products.list({ sort: 'newest', limit: '8', status: 'active' }),
            api.categories.list(),
          ]);

        if (cancelled) return;

        if (bestRes.status === 'fulfilled') {
          const res = bestRes.value as ApiListResponse<ApiProduct>;
          if (res.success && res.data?.length) {
            setBestSellers(res.data.map(apiProductToCardProduct));
          }
        }

        if (featuredRes.status === 'fulfilled') {
          const res = featuredRes.value as ApiListResponse<ApiProduct>;
          if (res.success && res.data?.length) {
            setFeatured(res.data.map(apiProductToCardProduct));
          }
        }

        if (popularRes.status === 'fulfilled') {
          const res = popularRes.value as ApiListResponse<ApiProduct>;
          if (res.success && res.data?.length) {
            setPopular(res.data.map(apiProductToCardProduct));
          }
        }

        if (newRes.status === 'fulfilled') {
          const res = newRes.value as ApiListResponse<ApiProduct>;
          if (res.success && res.data?.length) {
            setNewArrivalsProducts(res.data.map(apiProductToCardProduct));
          }
        }

        if (catRes.status === 'fulfilled') {
          const res = catRes.value as ApiListResponse<ApiCategory>;
          if (res.success && res.data?.length) {
            setCategories(res.data.map(apiCategoryToCarouselCategory));
          }
        }
      } catch {
        // Fall back to mock data (already set as defaults)
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Preloader />
      <HeroBanner />
      <CategoryCarousel
        categories={categories.length > 0 ? categories : undefined}
      />

      {/* Best Selling Products */}
      <section id="best-selling" className="overflow-hidden py-5">
        <div className="container mx-auto">
          <div className="mb-4 flex flex-wrap items-center justify-between">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-wide text-secondary-800 md:text-3xl">
              Best selling products
            </h2>
            <Link
              href="/products?sort=popular"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500"
            >
              View All
            </Link>
          </div>
          {loading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {bestSellers.slice(0, 10).map((product) => (
                <div key={product.id} className="mb-4">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <BannerAds />

      {loading ? (
        <SkeletonCarousel />
      ) : (
        <ProductCarousel
          title="Featured products"
          products={featured}
          viewAllLink="/products?sort=rating"
        />
      )}

      <Newsletter />

      {loading ? (
        <SkeletonCarousel />
      ) : (
        <ProductCarousel
          title="Most popular products"
          products={popular}
          viewAllLink="/products?sort=popular"
        />
      )}

      {loading ? (
        <SkeletonCarousel />
      ) : (
        <ProductCarousel
          title="Just arrived"
          products={newArrivalsProducts}
          viewAllLink="/products?sort=newest"
        />
      )}

      <BlogSection />
      <DownloadApp />
      <PopularTags />
      <TestimonialSection />
      <FeaturesStrip />
    </>
  );
}
