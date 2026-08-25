"use client";

import * as React from "react";
import Link from "next/link";
import { Truck, Leaf, Sprout } from "lucide-react";

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
  return (
    <section
      className="bg-cover bg-no-repeat"
      style={{ backgroundImage: "url('/images/banner-1.jpg')" }}
    >
      <div className="container mx-auto px-4">
        <div className="row">
          <div className="pt-5 mt-5 lg:col-6">
            <h2 className="font-heading text-4xl leading-tight md:text-6xl">
              <span className="font-bold text-primary">Organic</span> Foods at
              your <span className="font-bold">Doorsteps</span>
            </h2>
            <p className="mt-4 text-xl text-secondary-800">
              Dignissim massa diam elementum.
            </p>
            <div className="mt-3 flex gap-3">
              <Link
                href="/products"
                className="mt-3 rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase text-white hover:bg-primary-500"
              >
                Start Shopping
              </Link>
              <Link
                href="/register"
                className="mt-3 rounded-full bg-secondary-800 px-6 py-3 text-sm font-bold uppercase text-white hover:bg-secondary-900"
              >
                Join Now
              </Link>
            </div>

            <div className="my-5 grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-dark">
                  <p className="mb-0 text-3xl font-bold leading-tight">
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

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-3">
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
