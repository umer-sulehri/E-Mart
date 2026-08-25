'use client';

import Link from 'next/link';
import Preloader from '@/components/layout/Preloader';
import HeroBanner from '@/components/home/HeroBanner';
import CategoryCarousel from '@/components/home/CategoryCarousel';
import BannerAds from '@/components/home/BannerAds';
import ProductCarousel from '@/components/product/ProductCarousel';
import Newsletter from '@/components/home/Newsletter';
import BlogSection from '@/components/home/BlogSection';
import DownloadApp from '@/components/home/DownloadApp';
import PopularTags from '@/components/home/PopularTags';
import TestimonialSection from '@/components/home/TestimonialSection';
import FeaturesStrip from '@/components/home/FeaturesStrip';
import ProductCard from '@/components/product/ProductCard';
import {
  bestSellingProducts,
  featuredProducts,
  popularProducts,
  newArrivals,
} from '@/lib/mock/products';

export default function HomePage() {
  return (
    <>
      <Preloader />
      <HeroBanner />
      <CategoryCarousel />

      {/* Best Selling Products - Static Grid */}
      <section className="overflow-hidden py-5">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex flex-wrap items-center justify-between">
            <h2 className="font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
              Best selling products
            </h2>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500"
            >
              View All
            </Link>
          </div>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3 row-cols-xl-4 row-cols-xxl-5">
            {bestSellingProducts.slice(0, 10).map((product) => (
              <div key={product.id} className="col mb-4">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <BannerAds />

      <ProductCarousel
        title="Featured products"
        products={featuredProducts}
        viewAllLink="/shop?featured=true"
      />

      <Newsletter />

      <ProductCarousel
        title="Most popular products"
        products={popularProducts}
        viewAllLink="/shop?sort=popularity"
      />

      <ProductCarousel
        title="Just arrived"
        products={newArrivals}
        viewAllLink="/shop?sort=newest"
      />

      <BlogSection />
      <DownloadApp />
      <PopularTags />
      <TestimonialSection />
      <FeaturesStrip />
    </>
  );
}
