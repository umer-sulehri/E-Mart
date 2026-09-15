import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface BannerAdsProps {
  className?: string;
}

const BannerAds = React.forwardRef<HTMLDivElement, BannerAdsProps>(
  ({ className }, ref) => {
    return (
      <section ref={ref} className={cn("py-3", className)}>
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="banner-blocks">
            <div className="banner-ad relative flex items-center p-5 block-1 overflow-hidden">
              <Image
                src="/images/banner-ad-1.jpg"
                alt="Items on sale - discounts up to 30%"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
                quality={80}
              />
              <div className="banner-content relative z-10 p-5">
                <div className="content-wrapper text-light">
                  <h3 className="banner-title text-light font-heading text-2xl font-bold md:text-3xl">
                    Items on SALE
                  </h3>
                  <p className="mt-1 text-white">Discounts up to 30%</p>
                  <Link
                    href="/products?sort=sale"
                    className="btn-link text-white mt-3 inline-block"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>

            <div className="banner-ad relative block-2 overflow-hidden">
              <Image
                src="/images/banner-ad-2.jpg"
                alt="Combo offers - discounts up to 50%"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
                quality={80}
              />
              <div className="banner-content relative z-10 flex items-center p-5">
                <div className="content-wrapper text-light">
                  <h3 className="banner-title text-light font-heading text-2xl font-bold md:text-3xl">
                    Combo offers
                  </h3>
                  <p className="mt-1 text-white">Discounts up to 50%</p>
                  <Link
                    href="/products?sort=sale"
                    className="btn-link text-white mt-3 inline-block"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>

            <div className="banner-ad relative block-3 overflow-hidden">
              <Image
                src="/images/banner-ad-3.jpg"
                alt="Discount coupons - discounts up to 40%"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
                quality={80}
              />
              <div className="banner-content relative z-10 flex items-center p-5">
                <div className="content-wrapper text-light">
                  <h3 className="banner-title text-light font-heading text-2xl font-bold md:text-3xl">
                    Discount Coupons
                  </h3>
                  <p className="mt-1 text-white">Discounts up to 40%</p>
                  <Link
                    href="/products?sort=sale"
                    className="btn-link text-white mt-3 inline-block"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

BannerAds.displayName = "BannerAds";

export default BannerAds;
