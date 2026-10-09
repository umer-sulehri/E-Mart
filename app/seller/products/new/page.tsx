'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductForm, { type ProductFormData } from '@/components/seller/ProductForm';
import ProductQuotaBar from '@/components/seller/ProductQuotaBar';
import { useProductQuota } from '@/hooks/useProductQuota';
import { tryParseJson } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { formatDuration } from '@/lib/format-duration';
// Client component: the limit constant comes from the dependency-free module,
// not lib/seller-quota.ts, which imports Supabase and @vercel/kv.
import { MAX_PRODUCTS_PER_DAY } from '@/lib/product-limit';

export default function AddProductPage() {
  const router = useRouter();
  const { quota, loading: quotaLoading, refresh, setQuota } = useProductQuota();
  const quotaExhausted = quota?.exhausted === true;

  // This block only renders once the client-side quota fetch has resolved, so
  // reading the clock here cannot mismatch the server render.
  const quotaResetIn = quota?.resetAt
    ? new Date(quota.resetAt).getTime() - Date.now()
    : 0;

  const handleSubmit = async (data: ProductFormData) => {
    try {
      const imageUrls = data.images
        .map((img) => img.preview)
        .filter(Boolean);
      const res = await fetch('/api/v1/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          shortDescription: data.description,
          price: parseFloat(data.price),
          discountPrice: data.salePrice ? parseFloat(data.salePrice) : undefined,
          stockQuantity: parseInt(data.stockQuantity || '0', 10),
          sku: data.sku,
          categoryId: data.category,
          subcategoryId: data.subcategory || undefined,
          brand: data.brand.trim() || undefined,
          images: imageUrls,
          weight: data.weight ? parseInt(data.weight, 10) : undefined,
          isActive: data.status === 'active',
        }),
      });
      const json = await tryParseJson<{
        success: boolean;
        error?: string | { code?: string; message?: string };
        meta?: { remaining?: number; limit?: number; used?: number; resetAt?: string };
      }>(res);

      // The daily-limit response uses the standard envelope, where `error` is
      // an object; most other routes return a bare string. Normalise once here
      // so neither path renders "[object Object]".
      const errorMessage =
        typeof json?.error === 'string'
          ? json.error
          : json?.error?.message ?? null;

      if (res.status === 429) {
        const meta = json?.meta;
        const resetAt = meta?.resetAt ? new Date(meta.resetAt).getTime() : null;
        const waitFor =
          resetAt && resetAt > Date.now()
            ? ` You can upload again in ${formatDuration(resetAt - Date.now())}.`
            : '';

        trackEvent({
          action: 'product_upload_quota_exceeded',
          category: 'seller',
          label: 'daily_product_uploads',
          used: meta?.used ?? null,
        });

        toast.error(`${errorMessage ?? 'Daily product limit reached.'}${waitFor}`, {
          duration: 8000,
        });

        // Keep the panel in step with the server instead of leaving the seller
        // looking at a stale "3 of 10" after being rejected.
        setQuota({
          used: meta?.used ?? quota?.limit ?? MAX_PRODUCTS_PER_DAY,
          limit: meta?.limit ?? quota?.limit ?? MAX_PRODUCTS_PER_DAY,
          remaining: 0,
          resetAt: meta?.resetAt ?? null,
          exhausted: true,
          exempt: false,
          timezone: quota?.timezone,
        });
        return;
      }

      if (json?.success) {
        toast.success('Product created successfully');
        // Advance the local count immediately so the quota bar is correct on
        // return, without a second round trip.
        if (quota && !quota.exempt) {
          setQuota({
            ...quota,
            used: quota.used + 1,
            remaining: Math.max(0, quota.remaining - 1),
          });
        }
        router.push('/seller/products');
      } else {
        toast.error(errorMessage || 'Failed to create product');
      }
    } catch {
      toast.error('Failed to create product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-500">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-muted-500 transition-colors hover:text-primary"
        >
          <Home className="size-3.5" />
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/seller" className="text-muted-500 transition-colors hover:text-primary">
          Seller Dashboard
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/seller/products" className="text-muted-500 transition-colors hover:text-primary">
          Products
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-secondary-800">Add New</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          href="/seller/products"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-muted-200 bg-white px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-muted-50"
        >
          <ArrowLeft className="size-4" />
          Back to Products
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-secondary-800">Add New Product</h2>
          <p className="text-sm text-muted-500">Fill in the details to list a new product</p>
        </div>
      </div>

      <ProductQuotaBar quota={quota} loading={quotaLoading} />

      {quotaExhausted && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">
          <p className="font-medium">
            You have used all {quota?.limit ?? MAX_PRODUCTS_PER_DAY} uploads for today.
          </p>
          <p className="mt-1">
            {/* Only countdown while the reset is genuinely ahead of us; a stale
                timestamp must not render a negative duration. */}
            {quotaResetIn ? (
              <>Your allowance refreshes automatically in {formatDuration(quotaResetIn)}.</>
            ) : (
              <>Your allowance refreshes automatically at midnight PKT.</>
            )}{' '}
            Editing your existing products is not affected.
          </p>
          <Link
            href="/seller/products"
            className="mt-3 inline-flex items-center gap-1 font-medium underline hover:no-underline"
          >
            Back to your products
          </Link>
        </div>
      )}

      {/* Form */}
      <ProductForm
        mode="add"
        onSubmit={handleSubmit}
        quotaBlocked={quotaExhausted}
        quotaResetAt={quota?.resetAt ?? null}
      />
    </div>
  );
}
