'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCategories } from '@/hooks/useCategories';
import { useCreateSellerProduct, type SellerProductInput } from '@/hooks/useSeller';
import { CheckCircleIcon, PlusIcon, TrashIcon, ArrowLeftIcon } from '@/components/icons';

const MAX_IMAGES = 5;

export default function SellerAddProductPage() {
  const router = useRouter();
  const createProduct = useCreateSellerProduct();
  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', tags: '', categoryId: '', description: '',
    price: '', originalPrice: '',
    stock: '10',
    images: [] as string[], imageUrlInput: '',
  });

  const { data: apiCategories } = useCategories();
  const categories = (apiCategories ?? []).flatMap((c) => [c, ...(c.children || [])]);

  const autoDiscount = form.originalPrice && form.price && Number(form.originalPrice) > Number(form.price)
    ? Math.round(((Number(form.originalPrice) - Number(form.price)) / Number(form.originalPrice)) * 100)
    : 0;

  const handleAddImage = () => {
    const url = form.imageUrlInput.trim();
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol');
    } catch {
      setError('Image must be a valid http(s) URL.');
      return;
    }
    if (form.images.length >= MAX_IMAGES) {
      setError(`Maximum of ${MAX_IMAGES} images per product.`);
      return;
    }
    setError('');
    setForm({ ...form, images: [...form.images, url], imageUrlInput: '' });
  };

  const validateStep = (current: number): string => {
    if (current === 1) {
      if (form.name.trim().length < 3) return 'Product name is required (min 3 characters).';
      if (!form.categoryId) return 'Please select a category.';
      if (form.description.trim().length < 10) return 'Description is required (min 10 characters).';
    }
    if (current === 2) {
      if (!(Number(form.price) > 0)) return 'Price must be a positive number.';
      if (form.originalPrice && Number(form.originalPrice) <= Number(form.price)) {
        return 'Original price should be higher than the selling price.';
      }
      if (!(Number.parseInt(form.stock, 10) >= 0)) return 'Stock cannot be negative.';
    }
    if (current === 3 && form.images.length === 0) {
      return 'At least one product image URL is required.';
    }
    return '';
  };

  const handleNext = () => {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    for (let s = 1; s <= 3; s += 1) {
      const message = validateStep(s);
      if (message) {
        setError(message);
        setStep(s);
        return;
      }
    }

    const body: SellerProductInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      ...(form.originalPrice ? { originalPrice: Number(form.originalPrice) } : {}),
      stock: Number.parseInt(form.stock, 10),
      categoryId: form.categoryId,
      images: form.images,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      isNew: true,
    };

    try {
      await createProduct.mutateAsync(body);
      setSaved(true);
      setTimeout(() => router.push('/seller/products'), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create product.');
    }
  };

  const steps = ['Basic Info', 'Pricing & Stock', 'Media'];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <ArrowLeftIcon className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Add New Product</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Step {step} of {steps.length}: {steps[step - 1]}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 h-2 rounded-full transition-all" style={{ background: i < step ? 'var(--color-primary)' : 'var(--color-surface-alt)' }} />
        ))}
      </div>

      {saved && (
        <div className="rounded-xl p-4 flex items-center gap-2" style={{ background: 'rgba(110,139,94,0.15)', color: '#6E8B5E' }}>
          <CheckCircleIcon className="w-5 h-5" /> Product added successfully! Redirecting…
        </div>
      )}

      {!saved && error && (
        <div className="rounded-xl p-4 flex items-center gap-2 text-sm font-medium" style={{ background: 'rgba(182,92,75,0.12)', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Basic Information</h3>
            <div>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Product Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter product name" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Category *</label>
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.parentId ? `— ${c.name}` : c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Description *</label>
              <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Enter product description" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 resize-vertical" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Tags</label>
              <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Comma-separated e.g. organic, handmade, pantry" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            </div>
          </div>
        )}

        {/* Step 2: Pricing */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Pricing &amp; Stock</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Current Price (Rs) *</label>
                <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Original Price (Rs)</label>
                <input type="number" min="0" step="0.01" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} placeholder="0" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              </div>
            </div>
            {autoDiscount > 0 && (
              <div className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(122,155,118,0.12)', color: 'var(--color-primary)' }}>
                Auto-calculated discount: {autoDiscount}% off
              </div>
            )}
            <div>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Stock Quantity *</label>
              <input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Shoppers see “{Number.parseInt(form.stock, 10) > 10 ? 'Available' : Number.parseInt(form.stock, 10) > 0 ? 'Limited stock' : 'Out of stock'}” based on this quantity.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Media */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Media</h3>
            <div>
              <label className="block mb-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Product Images ({form.images.length}/{MAX_IMAGES}) *</label>
              <div className="flex flex-wrap gap-3">
                {form.images.map((img, i) => (
                  <div key={`${img}-${i}`} className="relative w-24 h-24 rounded-xl overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Product image ${i + 1}`} className="w-full h-full object-cover" />
                    <button type="button" aria-label={`Remove image ${i + 1}`} onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TrashIcon className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
                {form.images.length < MAX_IMAGES && (
                  <button type="button" onClick={handleAddImage} disabled={!form.imageUrlInput.trim()} className="w-24 h-24 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-40" style={{ background: 'var(--color-bg)', border: '2px dashed var(--color-border)', color: 'var(--color-text-secondary)' }}>
                    <PlusIcon className="w-5 h-5" />
                    <span className="text-[10px]">Add Image</span>
                  </button>
                )}
              </div>
              <input
                type="url"
                value={form.imageUrlInput}
                onChange={e => setForm({ ...form, imageUrlInput: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddImage(); } }}
                placeholder="Paste an image URL, e.g. https://…/photo.jpg"
                className="mt-3 w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                aria-label="Image URL"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>The first image is used as the cover photo.</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <button onClick={() => { setError(''); setStep(step - 1); }} disabled={createProduct.isPending} className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Previous</button>
        )}
        {step < steps.length ? (
          <button onClick={handleNext} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>Next Step</button>
        ) : (
          <button onClick={handleSubmit} disabled={createProduct.isPending} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
            {createProduct.isPending ? 'Saving…' : 'Add Product'}
          </button>
        )}
      </div>
    </div>
  );
}
