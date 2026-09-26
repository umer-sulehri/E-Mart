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

export default function AddProductPage() {
  const router = useRouter();
  const { quota, loading: quotaLoading, refresh, setQuota } = useProductQuota();
  const quotaExhausted = quota?.exhausted === true;

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
        error?: string;
        meta?: { remaining?: number; limit?: number; used?: number; resetAt?: string };
      }>(res);

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

        toast.error(`${json?.error || 'Daily product limit reached.'}${waitFor}`, {
          duration: 8000,
        });

        // Keep the panel in step with the server instead of leaving the seller
        // looking at a stale "3 of 10" after being rejected.
        setQuota({
          used: meta?.used ?? quota?.limit ?? 10,
          limit: meta?.limit ?? quota?.limit ?? 10,
          remaining: 0,
          resetAt: meta?.resetAt ?? null,
          exhausted: true,
        });
        return;
      }

      if (json?.success) {
        toast.success('Product created successfully');
        // Advance the local count immediately so the quota bar is correct on
        // return, without a second round trip.
        if (quota) {
          setQuota({
            ...quota,
            used: quota.used + 1,
            remaining: Math.max(0, quota.remaining - 1),
          });
        }
        router.push('/seller/products');
      } else {
        toast.error(json?.error || 'Failed to create product');
      }
    } catch {
      toast.error('Failed to create product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-500">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-muted-500 transition-colors hover:text-primary"
        >
          <Home className="h-3.5 w-3.5" />
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/seller" className="text-muted-500 transition-colors hover:text-primary">
          Seller Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/seller/products" className="text-muted-500 transition-colors hover:text-primary">
          Products
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-secondary-800">Add New</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          href="/seller/products"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-muted-200 bg-white px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-muted-50"
        >
          <ArrowLeft className="h-4 w-4" />
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
          <p className="font-medium">You have used all {quota?.limit ?? 10} uploads for today.</p>
          <p className="mt-1">
            Your allowance refreshes automatically
            {quota?.resetAt
              ? ` in ${formatDuration(new Date(quota.resetAt).getTime() - Date.now())}`
              : ' shortly'}
            . Editing your existing products is not affected.
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
      <ProductForm mode="add" onSubmit={handleSubmit} quotaBlocked={quotaExhausted} />
    </div>
  );
}
