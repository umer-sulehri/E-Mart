"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { resolveImage } from "@/lib/imageLoader";

export interface BannerAdsProps {
  className?: string;
}

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  mobile_image_url?: string | null;
  link_url: string | null;
  position: string;
  is_active: boolean;
}

const fallbackAds = [
  {
    key: "block-1",
    image: "/images/banner-ad-1.jpg",
    title: "Items on SALE",
    subtitle: "Discounts up to 30%",
    linkUrl: "/products?sort=sale",
  },
  {
    key: "block-2",
    image: "/images/banner-ad-2.jpg",
    title: "Combo offers",
    subtitle: "Discounts up to 50%",
    linkUrl: "/products?sort=sale",
  },
  {
    key: "block-3",
    image: "/images/banner-ad-3.jpg",
    title: "Discount Coupons",
    subtitle: "Discounts up to 40%",
    linkUrl: "/products?sort=sale",
  },
];

const BannerAds = React.forwardRef<HTMLDivElement, BannerAdsProps>(
  ({ className }, ref) => {
    const [ads, setAds] = useState<
      { key: string; image: string; title: string; subtitle: string; linkUrl: string }[] | null
    >(null);

    useEffect(() => {
      let cancelled = false;
      fetch("/api/v1/banners")
        .then((res) => res.json())
        .then((json) => {
          if (cancelled || !json.success || !Array.isArray(json.data)) return;
          const promos = json.data
            .filter(
              (b: Banner) =>
                b.is_active && b.position !== "home_top" && b.image_url
            )
            .slice(0, 3);
          if (promos.length === 0) return;
          setAds(
            promos.map((b: Banner, i: number) => ({
              key: `banner-${i}`,
              image: resolveImage(b.image_url),
              title: b.title,
              subtitle: b.subtitle ?? "Shop now",
              linkUrl: b.link_url ?? "/products",
            }))
          );
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, []);

    const displayAds = ads ?? fallbackAds;

    return (
      <section ref={ref} className={cn("py-3", className)}>
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="banner-blocks">
            {displayAds.map((ad, i) => (
              <div
                key={ad.key}
                className={`banner-ad ${i === 0 ? "flex items-center p-5 block-1" : i === 1 ? "block-2" : "block-3"}`}
                style={{
                  background: `url('${ad.image}') no-repeat`,
                  backgroundSize: "cover",
                }}
              >
                <div
                  className={cn(
                    "banner-content",
                    i === 0 ? "p-5" : "flex items-center p-5"
                  )}
                >
                  <div className="content-wrapper text-light">
                    <h3 className="banner-title text-light font-heading text-2xl font-bold md:text-3xl">
                      {ad.title}
                    </h3>
                    <p className="mt-1 text-white">{ad.subtitle}</p>
                    <Link
                      href={ad.linkUrl}
                      className="btn-link text-white mt-3 inline-block"
                    >
                      Shop Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
);

BannerAds.displayName = "BannerAds";

export default BannerAds;
