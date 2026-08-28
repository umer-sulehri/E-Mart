"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Truck, Leaf, Sprout } from "lucide-react";
import { resolveImage } from "@/lib/imageLoader";

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

const fallbackBanner = {
  image: "/images/banner-1.jpg",
  title: "Organic",
  titleSuffix: "Foods at your Doorsteps",
  subtitle: "Dignissim massa diam elementum.",
  linkUrl: "/products",
  cta: "Start Shopping",
};

const stats = [
  { value: "14k+", label: "Product Varieties" },
  { value: "50k+", label: "Happy Customers" },
  { value: "10+", label: "Store Locations" },
];

const features = [
  {
    icon: Sprout,
    title: "Fresh from farm",
    description: "Lorem ipsum dolor sit amet, consectetur adipi elit.",
    bgColor: "bg-primary",
  },
  {
    icon: Leaf,
    title: "100% Organic",
    description: "Lorem ipsum dolor sit amet, consectetur adipi elit.",
    bgColor: "bg-secondary",
  },
  {
    icon: Truck,
    title: "Free delivery",
    description: "Lorem ipsum dolor sit amet, consectetur adipi elit.",
    bgColor: "bg-danger",
  },
];

const HeroBanner = () => {
  const [banner, setBanner] = useState<{
    image: string;
    title: string;
    titleSuffix: string;
    subtitle: string;
    linkUrl: string;
    cta: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/banners")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json.success || !Array.isArray(json.data)) return;
        const hero = json.data.find(
          (b: Banner) => b.position === "home_top" && b.is_active
        );
        if (!hero) return;
        setBanner({
          image: resolveImage(hero.image_url),
          title: hero.title ?? fallbackBanner.title,
          titleSuffix: hero.titleSuffix ?? fallbackBanner.titleSuffix,
          subtitle: hero.subtitle ?? fallbackBanner.subtitle,
          linkUrl: hero.link_url ?? fallbackBanner.linkUrl,
          cta: hero.cta ?? fallbackBanner.cta,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const active = banner ?? fallbackBanner;

  const displayTitle = banner
    ? banner.title
    : fallbackBanner.title;
  const displayTitleSuffix = banner
    ? banner.titleSuffix
    : fallbackBanner.titleSuffix;
  const displaySubtitle = banner
    ? banner.subtitle
    : fallbackBanner.subtitle;
  const displayLinkUrl = banner ? banner.linkUrl : fallbackBanner.linkUrl;
  const displayCta = banner ? banner.cta : fallbackBanner.cta;

  return (
    <section
      id="hero-banner"
      className="bg-cover bg-no-repeat"
      style={{ backgroundImage: `url('${active.image}')` }}
    >
      <div className="container mx-auto px-4">
        <div className="row">
          <div className="pt-5 mt-5 lg:col-6">
            <h2 className="font-heading text-4xl leading-tight md:text-6xl">
              <span className="font-bold text-primary">{displayTitle}</span>{" "}
              {displayTitleSuffix}
            </h2>
            <p className="mt-4 text-2xl text-secondary-800">
              {displaySubtitle}
            </p>
            <div className="mt-3 flex gap-3">
              <Link
                href={displayLinkUrl}
                className="mt-3 rounded-full bg-primary px-4 py-3 text-sm font-bold uppercase text-white hover:bg-primary-hover"
              >
                {displayCta}
              </Link>
              <Link
                href="/register"
                className="mt-3 rounded-full bg-secondary-800 px-4 py-3 text-sm font-bold uppercase text-white hover:bg-secondary-900"
              >
                Join Now
              </Link>
            </div>

            <div className="my-5 grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-dark">
                  <p className="mb-0 text-5xl font-bold leading-tight">
                    {stat.value}
                  </p>
                  <p className="mb-0 text-xs uppercase leading-tight">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-3 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="col">
              <div
                className={`${feature.bgColor} rounded-none p-4 text-white`}
              >
                <div className="flex items-center gap-4">
                  <div className="shrink-0 text-center">
                    <feature.icon size={48} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h5 className="text-light">{feature.title}</h5>
                    <p className="mb-0 text-sm">{feature.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
