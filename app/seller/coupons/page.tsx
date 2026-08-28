'use client';

import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Tag,
  X,
  Loader2,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
  discount_value: number;
  minimum_order_amount: number;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  description?: string | null;
}

const defaultForm = {
  code: '',
  discountType: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
  discountValue: '',
  minOrder: '',
  usageLimit: '',
  startDate: '',
  endDate: '',
  isActive: true,
};

const toDateInput = (iso: string | null | undefined) => {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

export default function SellerCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/seller/coupons');
      const json = await res.json();
      if (json.success) setCoupons(json.data || []);
      else toast.error(json.error || 'Failed to load coupons');
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      discountType: coupon.discount_type === 'fixed_amount' ? 'fixed' : coupon.discount_type,
      discountValue: String(coupon.discount_value),
      minOrder: String(coupon.minimum_order_amount || ''),
      usageLimit: String(coupon.usage_limit ?? ''),
      startDate: toDateInput(coupon.starts_at),
      endDate: toDateInput(coupon.expires_at),
      isActive: coupon.is_active,
    });
    setShowForm(true);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm((prev) => ({ ...prev, code }));
  };

  const handleSave = async () => {
    if (!form.code || !form.discountValue || !form.startDate || !form.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code,
        discountType: form.discountType,
        discountValue: form.discountValue,
        minOrder: form.minOrder,
        usageLimit: form.usageLimit,
        startsAt: new Date(form.startDate).toISOString(),
        expiresAt: new Date(form.endDate).toISOString(),
        isActive: form.isActive,
      };

      const url = editingId
        ? `/api/v1/seller/coupons/${editingId}`
        : '/api/v1/seller/coupons';
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Save failed');
      }

      toast.success(json.message || (editingId ? 'Coupon updated' : 'Coupon created'));
      setShowForm(false);
      setEditingId(null);
      setForm(defaultForm);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`/api/v1/seller/coupons/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Delete failed');
      toast.success('Coupon deleted');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/v1/seller/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.is_active }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Update failed');
      toast.success(json.data.is_active ? 'Coupon activated' : 'Coupon deactivated');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-800">Coupons</h2>
          <p className="text-sm text-muted-500">Create and manage discount coupons</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-secondary-800">
              {editingId ? 'Edit Coupon' : 'Create New Coupon'}
            </h3>
            <button onClick={() => setShowForm(false)} className="rounded-lg p-1 hover:bg-muted-100">
              <X className="h-5 w-5 text-muted-600" />
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SAVE20"
                  className="flex-1 rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={generateCode}
                  className="rounded-lg border border-muted-200 px-3 py-2 text-muted-600 transition-colors hover:bg-muted-50"
                  title="Auto-generate code"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Discount Type</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm((prev) => ({ ...prev, discountType: e.target.value as typeof form.discountType }))}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (PKR)</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                Discount Value {form.discountType === 'percentage' ? '(%)' : form.discountType === 'free_shipping' ? '' : '(PKR)'}
              </label>
              <input
                type="number"
                min="0"
                value={form.discountValue}
                disabled={form.discountType === 'free_shipping'}
                onChange={(e) => setForm((prev) => ({ ...prev, discountValue: e.target.value }))}
                placeholder={form.discountType === 'free_shipping' ? 'Waived' : '0'}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-muted-50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Minimum Order (PKR)</label>
              <input
                type="number"
                min="0"
                value={form.minOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, minOrder: e.target.value }))}
                placeholder="0"
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Maximum Usage Limit</label>
              <input
                type="number"
                min="0"
                value={form.usageLimit}
                onChange={(e) => setForm((prev) => ({ ...prev, usageLimit: e.target.value }))}
                placeholder="100"
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3">
                <div
                  onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${form.isActive ? 'bg-success' : 'bg-muted-300'}`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${form.isActive ? 'translate-x-5' : ''}`}
                  />
                </div>
                <span className="text-sm font-medium text-secondary-800">
                  {form.isActive ? 'Active' : 'Inactive'}
                </span>
              </label>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Coupon' : 'Create Coupon'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100 bg-muted-50">
                <th className="px-6 py-3 font-medium text-muted-600">Code</th>
                <th className="px-6 py-3 font-medium text-muted-600">Discount</th>
                <th className="px-6 py-3 font-medium text-muted-600">Min Order</th>
                <th className="px-6 py-3 font-medium text-muted-600">Usage</th>
                <th className="px-6 py-3 font-medium text-muted-600">Status</th>
                <th className="px-6 py-3 font-medium text-muted-600">Expiry</th>
                <th className="px-6 py-3 font-medium text-muted-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-muted-500">
                    No coupons yet. Create your first coupon to start offering discounts.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-muted-50 transition-colors hover:bg-muted-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="font-mono font-semibold text-secondary-800">{coupon.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-secondary-800">
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}%`
                        : coupon.discount_type === 'free_shipping'
                        ? 'Free Shipping'
                        : formatPrice(coupon.discount_value)}
                    </td>
                    <td className="px-6 py-4 text-muted-600">
                      {coupon.minimum_order_amount > 0 ? formatPrice(coupon.minimum_order_amount) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={coupon.usage_limit && coupon.used_count >= coupon.usage_limit ? 'font-semibold text-danger' : 'text-secondary-800'}>
                        {coupon.used_count}
                        {coupon.usage_limit ? `/${coupon.usage_limit}` : '+'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={coupon.is_active ? 'success' : 'default'}>
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-600">
                      {coupon.expires_at ? formatDate(coupon.expires_at) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(coupon)}
                          className="rounded-lg p-2 text-muted-600 transition-colors hover:bg-primary-50 hover:text-primary"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(coupon)}
                          className="rounded-lg p-2 text-muted-600 transition-colors hover:bg-muted-100"
                          title={coupon.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="rounded-lg p-2 text-muted-600 transition-colors hover:bg-danger-50 hover:text-danger"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
