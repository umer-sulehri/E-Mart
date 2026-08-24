'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useCategories } from '@/hooks/useCategories';
import { useCreateProduct } from '@/hooks/useAdmin';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@/components/icons';

interface NewProductFormState {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  stock: string;
  categoryId: string;
  tags: string;
  isFeatured: boolean;
  isNew: boolean;
}

const INITIAL_FORM: NewProductFormState = {
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  stock: '0',
  categoryId: '',
  tags: '',
  isFeatured: false,
  isNew: true,
};

export default function AddProductPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const createProduct = useCreateProduct();
  const { data: categories } = useCategories();

  const [form, setForm] = useState<NewProductFormState>(INITIAL_FORM);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const flatCategories = (categories ?? []).flatMap((c) => [c, ...(c.children ?? [])]);

  const handleChange = <K extends keyof NewProductFormState>(field: K, value: NewProductFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddImage = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (images.length >= 5) {
      showToast('Maximum of 5 images per product', 'error');
      return;
    }
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol');
    } catch {
      showToast('Image must be a valid http(s) URL', 'error');
      return;
    }
    setImages((prev) => [...prev, url]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): string[] => {
    const errors: string[] = [];
    if (form.name.trim().length < 3) errors.push('Product name is required (min 3 characters).');
    if (form.description.trim().length < 10) errors.push('Description is required (min 10 characters).');
    if (!(Number(form.price) > 0)) errors.push('Price must be a positive number.');
    if (form.originalPrice && Number(form.originalPrice) <= Number(form.price)) {
      errors.push('Original price should be higher than the selling price.');
    }
    if (!(Number.parseInt(form.stock, 10) >= 0)) errors.push('Stock cannot be negative.');
    if (!form.categoryId) errors.push('Please select a category.');
    if (images.length === 0) errors.push('At least one product image URL is required.');
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    setValidationErrors(errors);
    if (errors.length > 0) return;

    try {
      await createProduct.mutate({
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        ...(form.originalPrice ? { originalPrice: Number(form.originalPrice) } : {}),
        stock: Number.parseInt(form.stock, 10),
        categoryId: form.categoryId,
        images,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        isFeatured: form.isFeatured,
        isNew: form.isNew,
      });
      showToast('Product created successfully', 'success');
      router.push('/admin/products');
    } catch {
      showToast('Failed to create product', 'error');
    }
  };

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

        <h1 className="mb-6 text-3xl font-bold text-text-primary">Add Product</h1>

        {validationErrors.length > 0 && (
          <Card className="mb-6 rounded-[16px] border border-error bg-surface p-4">
            <p className="mb-2 font-semibold text-error">Please fix the following:</p>
            <ul className="list-inside list-disc text-sm text-text-secondary">
              {validationErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left: Basic Info */}
            <Card className="rounded-[16px] bg-surface border border-border p-6">
              <h2 className="mb-4 text-lg font-semibold text-text-primary">Basic Info</h2>
              <div className="space-y-5">
                <Input
                  label="Product Name *"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Organic Basmati Rice 5kg"
                  className="h-[48px] rounded-[10px]"
                  required
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">Category *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => handleChange('categoryId', e.target.value)}
                    className="h-[48px] w-full rounded-[10px] border border-border bg-surface px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select a category</option>
                    {flatCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.parentId ? `— ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-secondary">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe the product, its features and benefits…"
                    rows={5}
                    className="min-h-[120px] w-full rounded-[10px] border border-border bg-surface px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <Input
                  label="Tags"
                  value={form.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  placeholder="Comma-separated tags e.g. organic, rice, pantry"
                  className="h-[48px] rounded-[10px]"
                />
              </div>
            </Card>

            {/* Right: Pricing, Stock & Media */}
            <div className="space-y-6">
              <Card className="rounded-[16px] bg-surface border border-border p-6">
                <h2 className="mb-4 text-lg font-semibold text-text-primary">Pricing &amp; Stock</h2>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Price (Rs) *"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={(e) => handleChange('price', e.target.value)}
                      className="h-[48px] rounded-[10px]"
                      required
                    />
                    <Input
                      label="Original Price (Rs)"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.originalPrice}
                      onChange={(e) => handleChange('originalPrice', e.target.value)}
                      className="h-[48px] rounded-[10px]"
                    />
                  </div>
                  {form.originalPrice && Number(form.originalPrice) > Number(form.price) && (
                    <p className="text-sm font-medium text-primary-dark">
                      Discount: {Math.round(((Number(form.originalPrice) - Number(form.price)) / Number(form.originalPrice)) * 100)}% off
                    </p>
                  )}
                  <Input
                    label="Stock Quantity *"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => handleChange('stock', e.target.value)}
                    className="h-[48px] rounded-[10px]"
                    required
                  />
                  <div className="flex flex-col gap-3 pt-1">
                    <label className="flex items-center gap-3 text-sm font-medium text-text-primary">
                      <input
                        type="checkbox"
                        checked={form.isFeatured}
                        onChange={(e) => handleChange('isFeatured', e.target.checked)}
                        className="h-5 w-5 rounded border-border accent-primary"
                      />
                      Featured Product
                    </label>
                    <label className="flex items-center gap-3 text-sm font-medium text-text-primary">
                      <input
                        type="checkbox"
                        checked={form.isNew}
                        onChange={(e) => handleChange('isNew', e.target.checked)}
                        className="h-5 w-5 rounded border-border accent-primary"
                      />
                      Mark as New Arrival
                    </label>
                  </div>
                </div>
              </Card>

              <Card className="rounded-[16px] bg-surface border border-border p-6">
                <h2 className="mb-4 text-lg font-semibold text-text-primary">Images</h2>
                <div className="mb-4 flex flex-wrap gap-3">
                  {images.map((img, i) => (
                    <div key={`${img}-${i}`} className="group relative h-24 w-24 overflow-hidden rounded-[10px] border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`Product image ${i + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        aria-label={`Remove image ${i + 1}`}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <TrashIcon className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  ))}
                  {images.length === 0 && (
                    <div className="flex h-24 w-24 items-center justify-center rounded-[10px] border-2 border-dashed border-border text-xs text-text-secondary">
                      No images
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImage();
                      }
                    }}
                    placeholder="https://example.com/image.jpg"
                    className="h-[48px] flex-1 rounded-[10px] border border-border bg-surface px-4 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Image URL"
                  />
                  <Button
                    type="button"
                    onClick={handleAddImage}
                    className="flex h-[48px] items-center gap-2 rounded-[10px] border border-border bg-surface px-4 text-text-primary"
                  >
                    <PlusIcon className="h-4 w-4" /> Add
                  </Button>
                </div>
                <p className="mt-2 text-xs text-text-secondary">Add up to 5 image URLs. The first image is used as the cover.</p>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              onClick={() => router.push('/admin/products')}
              className="rounded-[12px] min-h-[48px] min-w-[48px] bg-surface border border-border px-6 text-text-primary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProduct.isPending}
                  className="rounded-[12px] min-h-[48px] min-w-[48px] bg-primary px-6 text-text-inverse disabled:opacity-50"
            >
              {createProduct.isPending ? 'Creating…' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
