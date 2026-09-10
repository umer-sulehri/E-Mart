'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RefreshCw, ShoppingBag } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export default function ProductDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log failed product lookups so 404/500 spikes are visible in analytics.
    trackEvent({
      action: 'product_load_failed',
      category: 'error',
      label: error.message,
    });
  }, [error]);

  return (
    <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10">
        <AlertTriangle className="h-8 w-8 text-danger" />
      </div>
      <h1 className="mt-6 font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
        We couldn&apos;t load this product
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-600">
        Something went wrong while fetching this product. It may be temporarily
        unavailable or may no longer be in stock.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02] hover:bg-primary-500"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-lg border border-muted-200 px-6 py-3 text-sm font-medium text-secondary-700 transition-colors hover:border-primary hover:text-primary"
        >
          <ShoppingBag className="h-4 w-4" />
          Browse Products
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-muted-200 px-6 py-3 text-sm font-medium text-secondary-700 transition-colors hover:border-primary hover:text-primary"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
      </div>
    </section>
  );
}