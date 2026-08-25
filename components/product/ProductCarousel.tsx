"use client";

import * as React from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";

import "swiper/css";
import "swiper/css/navigation";

export interface ProductCarouselProps {
  title: string;
  products: Product[];
  viewAllLink: string;
  className?: string;
}

const ProductCarousel = React.forwardRef<HTMLDivElement, ProductCarouselProps>(
  ({ title, products, viewAllLink, className }, ref) => {
    const prevRef = React.useRef<HTMLButtonElement>(null);
    const nextRef = React.useRef<HTMLButtonElement>(null);
    const swiperRef = React.useRef<SwiperType | null>(null);

    return (
      <section ref={ref} className={cn("overflow-hidden py-5", className)}>
        <div className="container mx-auto max-w-[1320px] overflow-hidden px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex flex-wrap items-center justify-between">
            <h2 className="font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
              {title}
            </h2>

            <div className="flex items-center gap-2">
              <Link
                href={viewAllLink}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500"
              >
                View All
              </Link>
              <div className="flex items-center gap-1">
                <button
                  ref={prevRef}
                  className="swiper-prev flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-muted-100 text-dark transition-colors hover:bg-primary hover:text-white"
                  onClick={() => swiperRef.current?.slidePrev()}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  ref={nextRef}
                  className="swiper-next flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-muted-100 text-dark transition-colors hover:bg-primary hover:text-white"
                  onClick={() => swiperRef.current?.slideNext()}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <Swiper
            modules={[Navigation]}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onBeforeInit={(swiper) => {
              if (typeof swiper.params !== "object") return;
              const params = swiper.params as { navigation?: { prevEl?: string | HTMLElement | null; nextEl?: string | HTMLElement | null } };
              if (params.navigation) {
                params.navigation.prevEl = prevRef.current;
                params.navigation.nextEl = nextRef.current;
              }
            }}
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 4 },
              1280: { slidesPerView: 5 },
            }}
            className="products-carousel-swiper"
          >
            {products.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>
    );
  }
);

ProductCarousel.displayName = "ProductCarousel";

export default ProductCarousel;
