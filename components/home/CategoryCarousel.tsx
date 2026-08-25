"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const defaultCategories = [
  { id: 1, name: "Fruits & Veges", image: "/images/category-thumb-1.jpg", slug: "fruits-veges" },
  { id: 2, name: "Breads & Sweets", image: "/images/category-thumb-2.jpg", slug: "breads-sweets" },
  { id: 3, name: "Fruits & Veges", image: "/images/category-thumb-3.jpg", slug: "fruits-veges-2" },
  { id: 4, name: "Beverages", image: "/images/category-thumb-4.jpg", slug: "beverages" },
  { id: 5, name: "Meat Products", image: "/images/category-thumb-5.jpg", slug: "meat-products" },
  { id: 6, name: "Breads", image: "/images/category-thumb-6.jpg", slug: "breads" },
  { id: 7, name: "Fruits & Veges", image: "/images/category-thumb-7.jpg", slug: "fruits-veges-3" },
  { id: 8, name: "Breads & Sweets", image: "/images/category-thumb-8.jpg", slug: "breads-sweets-2" },
];

export interface CategoryItem {
  id: string | number;
  name: string;
  slug: string;
  image: string;
}

interface CategoryCarouselProps {
  categories?: CategoryItem[];
}

const CategoryCarousel = ({ categories: propCategories }: CategoryCarouselProps = {}) => {
  const categories = propCategories || defaultCategories;
  const swiperPrevRef = React.useRef<HTMLButtonElement>(null);
  const swiperNextRef = React.useRef<HTMLButtonElement>(null);

  return (
    <section id="categories" className="overflow-hidden py-5">
      <div className="container mx-auto px-4">
        <div className="mb-5 flex flex-wrap items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
            Category
          </h2>
          <div className="flex items-center">
            <Link
              href="/categories"
              className="me-2 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-500"
            >
              View All
            </Link>
            <div className="flex gap-2">
              <button
                ref={swiperPrevRef}
                className="swiper-prev category-carousel-prev flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-muted-100 text-dark hover:bg-primary hover:text-white"
              >
                &#10094;
              </button>
              <button
                ref={swiperNextRef}
                className="swiper-next category-carousel-next flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-muted-100 text-dark hover:bg-primary hover:text-white"
              >
                &#10095;
              </button>
            </div>
          </div>
        </div>

        <Swiper
          modules={[Navigation]}
          spaceBetween={20}
          slidesPerView={2}
          navigation={{
            prevEl: swiperPrevRef.current,
            nextEl: swiperNextRef.current,
          }}
          onBeforeInit={(swiper) => {
            if (swiper.params.navigation && typeof swiper.params.navigation === "object") {
              swiper.params.navigation.prevEl = swiperPrevRef.current;
              swiper.params.navigation.nextEl = swiperNextRef.current;
            }
          }}
          breakpoints={{
            0: { slidesPerView: 2 },
            640: { slidesPerView: 4 },
            1024: { slidesPerView: 6 },
          }}
        >
          {categories.map((category) => (
            <SwiperSlide key={category.id}>
              <Link
                href={`/products?category=${category.slug}`}
                className="category-item block rounded-2xl bg-white p-[60px_20px] text-center"
              >
                <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full md:h-28 md:w-28">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h4 className="mt-3 text-base font-semibold tracking-[0.02em] text-dark">
                  {category.name}
                </h4>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default CategoryCarousel;
