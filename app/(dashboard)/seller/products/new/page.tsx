'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockCategories } from '@/lib/mock/products';
import { CheckCircleIcon, PlusIcon, TrashIcon, ArrowLeftIcon } from '@/components/icons';

interface ColorInput { name: string; hex: string; }
interface SpecInput { key: string; value: string; }

const COLOR_MAP: Record<string, string> = {
  red: '#FF0000', blue: '#0000FF', green: '#008000', black: '#000000', white: '#FFFFFF',
  yellow: '#FFFF00', orange: '#FFA500', purple: '#800080', pink: '#FFC0CB', brown: '#A52A2A',
  gray: '#808080', grey: '#808080', silver: '#C0C0C0', gold: '#FFD700', navy: '#000080',
  teal: '#008080', maroon: '#800000', olive: '#808000', lime: '#00FF00', cyan: '#00FFFF',
};

function getColorHex(name: string): string {
  const lower = name.toLowerCase().trim();
  return COLOR_MAP[lower] || '#808080';
}

export default function SellerAddProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '', brand: '', category: '', description: '',
    price: '', originalPrice: '', discount: '',
    stockStatus: 'available', warranty: '1-year',
    images: [] as string[], videoUrl: '',
  });
  const [colors, setColors] = useState<ColorInput[]>([{ name: '', hex: '#000000' }]);
  const [specs, setSpecs] = useState<SpecInput[]>([{ key: '', value: '' }]);

  const categories = mockCategories.flatMap(c => [c, ...(c.children || [])]);

  const autoDiscount = form.originalPrice && form.price && Number(form.originalPrice) > Number(form.price)
    ? Math.round(((Number(form.originalPrice) - Number(form.price)) / Number(form.originalPrice)) * 100)
    : 0;

  const handleAddColor = () => setColors([...colors, { name: '', hex: '#000000' }]);
  const handleRemoveColor = (i: number) => setColors(colors.filter((_, idx) => idx !== i));
  const handleColorChange = (i: number, name: string) => {
    const updated = [...colors];
    updated[i] = { name, hex: getColorHex(name) };
    setColors(updated);
  };

  const handleAddSpec = () => setSpecs([...specs, { key: '', value: '' }]);
  const handleRemoveSpec = (i: number) => setSpecs(specs.filter((_, idx) => idx !== i));
  const handleSpecChange = (i: number, field: 'key' | 'value', val: string) => {
    const updated = [...specs];
    updated[i] = { ...updated[i], [field]: val };
    setSpecs(updated);
  };

  const handleImageUpload = () => {
    if (form.images.length < 5) {
      setForm({ ...form, images: [...form.images, `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop`] });
    }
  };

  const handleSubmit = () => {
    setSaved(true);
    setTimeout(() => router.push('/seller/products'), 1500);
  };

  const steps = ['Basic Info', 'Pricing & Stock', 'Media', 'Colors & Specs'];

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
          <CheckCircleIcon className="w-5 h-5" /> Product added successfully!
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
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Brand *</label>
              <input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Enter brand name" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Description *</label>
              <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Enter product description" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 resize-vertical" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            </div>
          </div>
        )}

        {/* Step 2: Pricing */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Pricing & Stock</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Current Price (Rs) *</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Original Price (Rs)</label>
                <input type="number" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} placeholder="0" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              </div>
            </div>
            {autoDiscount > 0 && (
              <div className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(122,155,118,0.12)', color: 'var(--color-primary)' }}>
                Auto-calculated discount: {autoDiscount}% off
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Stock Status</label>
                <select value={form.stockStatus} onChange={e => setForm({ ...form, stockStatus: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                  <option value="available">Available</option>
                  <option value="limited">Limited</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Warranty</label>
                <select value={form.warranty} onChange={e => setForm({ ...form, warranty: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
                  <option value="6-months">6 Months</option>
                  <option value="1-year">1 Year</option>
                  <option value="2-years">2 Years</option>
                  <option value="3-years">3 Years</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Media */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Media</h3>
            <div>
              <label className="block mb-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Product Images (max 5)</label>
              <div className="flex flex-wrap gap-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setForm({ ...form, images: form.images.filter((_, idx) => idx !== i) })} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TrashIcon className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
                {form.images.length < 5 && (
                  <button onClick={handleImageUpload} className="w-24 h-24 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors" style={{ background: 'var(--color-bg)', border: '2px dashed var(--color-border)', color: 'var(--color-text-secondary)' }}>
                    <PlusIcon className="w-5 h-5" />
                    <span className="text-[10px]">Add Image</span>
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Video URL (optional)</label>
              <input type="url" value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://..." className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Supported: MP4, WebM, OGG (max 50MB)</p>
            </div>
          </div>
        )}

        {/* Step 4: Colors & Specs */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Colors */}
            <div>
              <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Available Colors</h3>
              <div className="space-y-3">
                {colors.map((color, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border" style={{ background: color.hex }} />
                    <input type="text" value={color.name} onChange={e => handleColorChange(i, e.target.value)} placeholder="Color name (e.g. Red)" className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                    <input type="color" value={color.hex} onChange={e => { const updated = [...colors]; updated[i] = { ...updated[i], hex: e.target.value }; setColors(updated); }} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                    {colors.length > 1 && <button onClick={() => handleRemoveColor(i)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--color-error)' }}><TrashIcon className="w-4 h-4" /></button>}
                  </div>
                ))}
              </div>
              <button onClick={handleAddColor} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--color-bg)', border: '1px dashed var(--color-border)', color: 'var(--color-primary)' }}>
                <PlusIcon className="w-4 h-4" /> Add Another Color
              </button>
            </div>

            {/* Specs */}
            <div>
              <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Technical Specifications</h3>
              <div className="space-y-3">
                {specs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input type="text" value={spec.key} onChange={e => handleSpecChange(i, 'key', e.target.value)} placeholder="Key (e.g. Processor)" className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                    <input type="text" value={spec.value} onChange={e => handleSpecChange(i, 'value', e.target.value)} placeholder="Value (e.g. Intel i7)" className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                    {specs.length > 1 && <button onClick={() => handleRemoveSpec(i)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'var(--color-error)' }}><TrashIcon className="w-4 h-4" /></button>}
                  </div>
                ))}
              </div>
              <button onClick={handleAddSpec} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'var(--color-bg)', border: '1px dashed var(--color-border)', color: 'var(--color-primary)' }}>
                <PlusIcon className="w-4 h-4" /> Add Specification
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Previous</button>
        )}
        {step < steps.length ? (
          <button onClick={() => setStep(step + 1)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>Next Step</button>
        ) : (
          <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>Add Product</button>
        )}
      </div>
    </div>
  );
}
