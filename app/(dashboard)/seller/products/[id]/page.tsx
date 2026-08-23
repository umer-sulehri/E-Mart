'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import {
  useUpdateSellerProduct,
  useDeleteSellerProduct,
} from '@/hooks/useSeller';
import { useImageUpload } from '@/hooks/useUpload';
import { ArrowLeftIcon, CheckCircleIcon, PlusIcon, TrashIcon } from '@/components/icons';

const MAX_IMAGES = 5;

export default function SellerEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    params.then((p) => setSlug(p.id));
  }, [params]);

  const { data: product } = useProduct(slug);
  const updateProduct = useUpdateSellerProduct();
  const deleteProduct = useDeleteSellerProduct();
  const { data: apiCategories } = useCategories();
  const categories = (apiCategories ?? []).flatMap((c) => [c, ...(c.children || [])]);

  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    description: '',
    price: '0',
    originalPrice: '',
    stock: '0',
    tags: '',
    images: [] as string[],
    imageUrlInput: '',
  });

  const [initializedId, setInitializedId] = useState<string | null>(null);
  if (product && initializedId !== product.id) {
    setInitializedId(product.id);
    setForm({
      name: product.name || '',
      categoryId: product.category?.id || product.categoryId || '',
      description: product.description || '',
      price: String(product.price ?? 0),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      stock: String(product.stock ?? 0),
      tags: (product.tags || []).join(', '),
      images: product.images || [],
      imageUrlInput: '',
    });
  }

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

  const upload = useImageUpload((message) => setError(message));

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (form.images.length >= MAX_IMAGES) {
      setError(`Maximum of ${MAX_IMAGES} images per product.`);
      return;
    }
    upload.mutate(file, {
      onSuccess: (res) => {
        setError('');
        setForm((f) => ({ ...f, images: [...f.images, res.url] }));
      },
    });
  };

  const handleSave = async () => {
    if (!product) return;
    if (form.name.trim().length < 3) {
      setError('Product name is required (min 3 characters).');
      return;
    }
    if (!(Number(form.price) > 0)) {
      setError('Price must be a positive number.');
      return;
    }

    try {
      await updateProduct.mutateAsync({
        id: product.id,
        body: {
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          ...(form.originalPrice ? { originalPrice: Number(form.originalPrice) } : {}),
          stock: Number.parseInt(form.stock, 10) || 0,
          ...(form.categoryId ? { categoryId: form.categoryId } : {}),
          images: form.images,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        },
      });
      setSaved(true);
      setTimeout(() => router.push('/seller/products'), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save changes.');
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    try {
      await deleteProduct.mutateAsync(product.id);
      router.push('/seller/products');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete product.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <ArrowLeftIcon className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Edit Product</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Update product information</p>
        </div>
      </div>

      {!product && !error && (
        <div className="rounded-[16px] p-10 text-center text-sm" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
          Loading product…
        </div>
      )}

      {product && !error && saved && (
        <div className="rounded-xl p-4 flex items-center gap-2" style={{ background: 'rgba(110,139,94,0.15)', color: '#6E8B5E' }}>
          <CheckCircleIcon className="w-5 h-5" /> Product updated successfully! Redirecting…
        </div>
      )}

      {error && (
        <div className="rounded-xl p-4 flex items-center gap-2 text-sm font-medium" style={{ background: 'rgba(182,92,75,0.12)', color: 'var(--color-error)' }}>
          {error}
        </div>
      )}

      {product && (
        <>
          <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
            <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Product Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Product Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Price (Rs) *</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Original Price (Rs)</label>
                  <input type="number" min="0" step="0.01" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} placeholder="Optional" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Stock Quantity</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Category</label>
                  <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                    <option value="">Keep current category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.parentId ? `— ${c.name}` : c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Description</label>
                <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 resize-vertical" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Tags</label>
                <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Comma-separated tags" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              </div>
            </div>
          </div>

          <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
            <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Images ({form.images.length}/{MAX_IMAGES})</h3>
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
              placeholder="Paste an image URL to add"
              className="mt-3 w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              aria-label="Image URL"
            />
            <label className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors hover:opacity-80" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
              <PlusIcon className="w-4 h-4" />
              {upload.isPending ? 'Uploading…' : 'Upload from device'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelected}
                disabled={upload.isPending}
              />
            </label>
          </div>

          <div className="flex gap-3">
            <button onClick={() => router.back()} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancel</button>
            <button
              onClick={handleDelete}
              disabled={deleteProduct.isPending}
              className="px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: 'rgba(182,92,75,0.12)', color: 'var(--color-error)', border: '1px solid var(--color-error)' }}
            >
              {deleteProduct.isPending ? 'Deleting…' : 'Delete'}
            </button>
            <button onClick={handleSave} disabled={updateProduct.isPending} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
              {updateProduct.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
