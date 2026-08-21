'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useProduct } from '@/hooks/useProducts';
import { useUpdateProduct } from '@/hooks/useAdmin';
import { ArrowLeftIcon } from '@/components/icons';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { showToast } = useToast();
  const updateProduct = useUpdateProduct();

  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const { data: product, isLoading, error } = useProduct(id ?? '');

  interface ProductFormState {
    name: string;
    price: number;
    originalPrice: number;
    stock: number;
    description: string;
    tags: string;
    featured: boolean;
  }

  const [formData, setFormData] = useState<ProductFormState>({
    name: '',
    price: 0,
    originalPrice: 0,
    stock: 0,
    description: '',
    tags: '',
    featured: false,
  });
  const [formProductId, setFormProductId] = useState<string | null>(null);

  // Initialize the form once per loaded product (render-phase state adjustment).
  if (product && formProductId !== product.id) {
    setFormProductId(product.id);
    setFormData({
      name: product.name || '',
      price: product.price ?? 0,
      originalPrice: product.originalPrice ?? 0,
      stock: product.stock ?? 0,
      description: product.description || '',
      tags: (product.tags || []).join(', '),
      featured: product.isFeatured ?? false,
    });
  }

  const handleChange = <K extends keyof ProductFormState>(field: K, value: ProductFormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await updateProduct.mutate({
        id,
        body: {
          ...formData,
          tags: formData.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        },
      });
      showToast('Product updated successfully', 'success');
      router.push('/admin/products');
    } catch {
      showToast('Failed to update product', 'error');
    }
  };

  const handleCancel = () => {
    router.push('/admin/products');
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-bg p-6">
        <div className="mx-auto max-w-5xl">
          <Card className="rounded-[16px] bg-surface border border-border p-6">
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
              <span className="ml-3 text-text-secondary">Loading...</span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg p-6">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/admin/products"
            className="mb-6 inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Products
          </Link>
          <Card className="rounded-[16px] bg-surface border border-border p-12 text-center">
            <p className="text-lg font-medium text-error">Failed to load product.</p>
            <p className="mt-2 text-text-secondary">The product may not exist or an error occurred.</p>
            <Button
              onClick={() => router.push('/admin/products')}
              className="mt-6 rounded-[12px] min-h-[48px] min-w-[48px] bg-primary px-6 text-primary"
            >
              Back to Products
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg p-6">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/admin/products"
            className="mb-6 inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Products
          </Link>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="rounded-[16px] bg-surface border border-border p-6">
              <div className="space-y-4">
                <div className="h-48 w-full animate-pulse rounded-[10px] bg-surface-alt" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-surface-alt" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-surface-alt" />
              </div>
            </Card>
            <Card className="rounded-[16px] bg-surface border border-border p-6">
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-surface-alt" />
                    <div className="h-12 w-full animate-pulse rounded-[10px] bg-surface-alt" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-6">
      <div className="mx-auto max-w-5xl">
        {/* Back link */}
        <Link
          href="/admin/products"
          className="mb-6 inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Products
        </Link>

        <h1 className="mb-6 text-3xl font-bold text-text-primary">Edit Product</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Product Info Card */}
          <Card className="rounded-[16px] bg-surface border border-border p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Product Info</h2>

            <div className="mb-4 overflow-hidden rounded-[10px] border border-border">
              {product?.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={formData.name}
                  className="h-64 w-full object-cover"
                />
              ) : (
                <div className="flex h-64 w-full items-center justify-center bg-surface-alt text-text-secondary">
                  No image
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm text-text-secondary">Name</span>
                <p className="font-medium text-text-primary">{product?.name || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-text-secondary">Category</span>
                  <p className="font-medium text-text-primary">{product?.category?.name || '—'}</p>
                </div>
                <div>
                  <span className="text-sm text-text-secondary">Rating</span>
                  <p className="font-medium text-text-primary">{product?.rating ?? 0} ({product?.reviewCount ?? 0} reviews)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-text-secondary">Current Price</span>
                  <p className="font-medium text-primary">${(product?.price ?? 0).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-sm text-text-secondary">Stock</span>
                  <p className="font-medium text-text-primary">{product?.stock ?? 0}</p>
                </div>
              </div>
              {product?.createdAt && (
                <div>
                  <span className="text-sm text-text-secondary">Created</span>
                  <p className="font-medium text-text-primary">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Right: Edit Form Card */}
          <Card className="rounded-[16px] bg-surface border border-border p-6">
            <h2 className="mb-6 text-lg font-semibold text-text-primary">Edit Details</h2>

            <form onSubmit={handleSave} className="space-y-5">
              <Input
                  label="Product Name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="h-[48px] rounded-[10px]"
                  required
                />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                    className="h-[48px] rounded-[10px]"
                    required
                  />
                </div>
                <div>
                  <Input
                    label="Original Price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.originalPrice}
                    onChange={(e) => handleChange('originalPrice', parseFloat(e.target.value) || 0)}
                    className="h-[48px] rounded-[10px]"
                  />
                </div>
              </div>

              <Input
                  label="Stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => handleChange('stock', parseInt(e.target.value) || 0)}
                  className="h-[48px] rounded-[10px]"
                  required
                />

              <div>
                <label className="mb-1 block text-sm font-medium text-text-secondary">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full rounded-[10px] border border-border bg-surface px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                  rows={4}
                />
              </div>

              <Input
                  label="Tags"
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  placeholder="Comma-separated tags"
                  className="h-[48px] rounded-[10px]"
                />

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => handleChange('featured', e.target.checked)}
                  className="h-5 w-5 rounded border-border accent-primary"
                />
                <label htmlFor="featured" className="text-sm font-medium text-text-primary">
                  Featured Product
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-[12px] min-h-[48px] min-w-[48px] bg-surface border border-border px-6 text-text-primary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateProduct.isPending}
                  className="rounded-[12px] min-h-[48px] min-w-[48px] bg-primary px-6 text-primary disabled:opacity-50"
                >
                  {updateProduct.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
