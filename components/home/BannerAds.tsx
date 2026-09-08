import * as React from "react";
import Link from "next/link";
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
            <div
              className="banner-ad flex items-center p-5 block-1"
              style={{
                background: "url('/images/banner-ad-1.jpg') no-repeat",
                backgroundSize: "cover",
              }}
            >
              <div className="banner-content p-5">
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

            <div
              className="banner-ad block-2"
              style={{
                background: "url('/images/banner-ad-2.jpg') no-repeat",
                backgroundSize: "cover",
              }}
            >
              <div className="banner-content flex items-center p-5">
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

            <div
              className="banner-ad block-3"
              style={{
                background: "url('/images/banner-ad-3.jpg') no-repeat",
                backgroundSize: "cover",
              }}
            >
              <div className="banner-content flex items-center p-5">
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
