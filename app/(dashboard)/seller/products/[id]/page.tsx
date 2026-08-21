'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProduct } from '@/hooks/useProducts';
import { Product } from '@/lib/types';
import { ArrowLeftIcon, CheckCircleIcon } from '@/components/icons';

export default function SellerEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const resolvedParams = params as any;
  const slug = resolvedParams?.id ?? '';
  const { data: product, isLoading } = useProduct(slug);

  const [form, setForm] = useState({
    name: '',
    brand: 'Generic',
    category: '',
    description: '',
    price: 0,
    originalPrice: 0,
    stock: 0,
    stockStatus: 'available',
  });

  const [initialized, setInitialized] = useState(false);

  if (product && !initialized) {
    setForm({
      name: product.name,
      brand: 'Generic',
      category: product.category?.slug || '',
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      stock: product.stock,
      stockStatus: product.stock > 10 ? 'available' : product.stock > 0 ? 'limited' : 'out-of-stock',
    });
    setInitialized(true);
  }

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => router.push('/seller/products'), 1500);
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

      {saved && (
        <div className="rounded-xl p-4 flex items-center gap-2" style={{ background: 'rgba(110,139,94,0.15)', color: '#6E8B5E' }}>
          <CheckCircleIcon className="w-5 h-5" /> Product updated successfully!
        </div>
      )}

      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Product Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Product Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Price (Rs)</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Stock</label>
              <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            </div>
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Description</label>
            <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 resize-vertical" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Stock Status</label>
            <select value={form.stockStatus} onChange={e => setForm({ ...form, stockStatus: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
              <option value="available">Available</option>
              <option value="limited">Limited</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancel</button>
        <button onClick={handleSave} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>Save Changes</button>
      </div>
    </div>
  );
}
