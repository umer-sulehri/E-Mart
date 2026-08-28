'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Loader2,
  BadgePercent,
  Star,
  Sparkles,
  Save,
  Check,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { resolveImage } from '@/lib/imageLoader';

interface OfferProduct {
  id: string;
  name: string;
  images: string[] | null;
  price: number;
  discount_price: number | null;
  is_featured: boolean;
  is_new: boolean;
  categories?: { name: string } | null;
}

type SavingId = string | null;

export default function AdminOffersPage() {
  const [products, setProducts] = useState<OfferProduct[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<{ id: string; field: string } | null>(null);
  const [justSaved, setJustSaved] = useState<SavingId>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/admin/products?limit=100')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          if (json.success) setProducts(json.data || []);
          else setError(json.error || 'Failed to load products');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load products');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveField = useCallback(
    async (id: string, field: string, value: unknown) => {
      setSaving({ id, field });
      try {
        const res = await fetch(`/api/v1/admin/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value, updated_at: new Date().toISOString() }),
        });
        const json = await res.json();
        if (json.success) {
          setProducts((prev) =>
            prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
          );
          setJustSaved(id);
          setTimeout(() => setJustSaved(null), 1500);
        } else {
          setError(json.error || 'Update failed');
        }
      } catch {
        setError('Update failed');
      } finally {
        setSaving(null);
      }
    },
    []
  );

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const featuredCount = products.filter((p) => p.is_featured).length;
  const newCount = products.filter((p) => p.is_new).length;
  const discountCount = products.filter((p) => p.discount_price != null).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">Offers</h1>
        <p className="text-sm text-muted-500">
          Manage featured, new and discounted products
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{featuredCount}</p>
              <p className="text-xs text-muted-500">Featured Products</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{newCount}</p>
              <p className="text-xs text-muted-500">New Arrivals</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-100 text-danger-600">
              <BadgePercent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{discountCount}</p>
              <p className="text-xs text-muted-500">Discounted Products</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-muted-200 bg-white py-2 pl-10 pr-4 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100">
                <th className="pb-3 font-medium text-muted-500">Product</th>
                <th className="hidden pb-3 font-medium text-muted-500 md:table-cell">Price</th>
                <th className="pb-3 font-medium text-muted-500">Featured</th>
                <th className="pb-3 font-medium text-muted-500">New</th>
                <th className="pb-3 font-medium text-muted-500">Discount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-50">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-muted-50/50">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted-100">
                        <ImageWithFallback
                          src={resolveImage(product.images?.[0])}
                          alt={product.name}
                          width={60}
                          height={60}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-secondary-800">{product.name}</p>
                        <p className="truncate text-xs text-muted-500">
                          {product.categories?.name || 'Uncategorized'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden py-3 md:table-cell">
                    <p className="font-medium text-secondary-800">{formatPrice(product.price)}</p>
                    {product.discount_price != null && (
                      <p className="text-xs text-success">{formatPrice(product.discount_price)}</p>
                    )}
                  </td>
                  <td className="py-3">
                    <Toggle
                      checked={product.is_featured}
                      loading={saving?.id === product.id && saving?.field === 'is_featured'}
                      onChange={(v) => saveField(product.id, 'is_featured', v)}
                    />
                  </td>
                  <td className="py-3">
                    <Toggle
                      checked={product.is_new}
                      loading={saving?.id === product.id && saving?.field === 'is_new'}
                      onChange={(v) => saveField(product.id, 'is_new', v)}
                    />
                  </td>
                  <td className="py-3">
                    {justSaved === product.id ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <Check className="h-4 w-4" /> Saved
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          defaultValue={product.discount_price ?? ''}
                          placeholder="0"
                          onBlur={(e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            if (val !== product.discount_price) {
                              saveField(product.id, 'discount_price', val);
                            }
                          }}
                          className="w-24 rounded-lg border border-muted-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                        />
                        {saving?.id === product.id && saving?.field === 'discount_price' && (
                          <Save className="h-4 w-4 animate-pulse text-primary" />
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  loading,
  onChange,
}: {
  checked: boolean;
  loading?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={loading}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted-300',
        loading && 'opacity-50'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}
