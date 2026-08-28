'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductForm from '@/components/seller/ProductForm';

interface LoadedProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number;
  stock_quantity?: number;
  sku?: string;
  category_id?: string;
  subcategory_id?: string;
  images?: string[];
  weight?: number;
  is_active?: boolean;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<LoadedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/v1/seller/products/${productId}`);
        const json = await res.json();
        if (!cancelled) {
          if (json.success) setProduct(json.data);
          else setNotFound(true);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleSubmit = async (data: any) => {
    try {
      const imageUrls = data.images
        .map((img: any) => img.preview)
        .filter(Boolean);
      const res = await fetch(`/api/v1/seller/products/${productId}`, {
        method: 'PUT',
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
          images: imageUrls,
          weight: data.weight ? parseInt(data.weight, 10) : undefined,
          isActive: data.status === 'active',
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Product updated successfully');
        router.push('/seller/products');
      } else {
        toast.error(json.error || 'Failed to update product');
      }
    } catch {
      toast.error('Failed to update product');
    }
  };

  const initialData = product
    ? {
        name: product.name,
        description: product.description || '',
        category: product.category_id || '',
        subcategory: product.subcategory_id || '',
        sku: product.sku || '',
        price: product.price != null ? String(product.price) : '',
        salePrice: product.discount_price != null ? String(product.discount_price) : '',
        stockQuantity: product.stock_quantity != null ? String(product.stock_quantity) : '',
        weight: product.weight != null ? String(product.weight) : '',
        images: (product.images || []).map((url) => ({ preview: url, alt: product.name })),
        status: product.is_active === false ? ('draft' as const) : ('active' as const),
      }
    : undefined;

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
        <span className="text-secondary-800">Edit Product</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/seller/products"
          className="inline-flex items-center gap-2 rounded-lg border border-muted-200 bg-white px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-muted-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-secondary-800">Edit Product</h2>
          <p className="text-sm text-muted-500">
            {loading
              ? 'Loading product...'
              : notFound
                ? 'Product not found.'
                : `Updating: ${product?.name}`}
          </p>
        </div>
      </div>

      {/* Form */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-500">Loading...</div>
      ) : notFound ? (
        <div className="rounded-xl bg-white p-8 text-center text-muted-500 shadow-sm">
          This product could not be found or you do not have access to it.
        </div>
      ) : (
        <ProductForm initialData={initialData} mode="edit" onSubmit={handleSubmit} />
      )}
    </div>
  );
}
