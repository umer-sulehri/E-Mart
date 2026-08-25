'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Tag,
  Plus,
  Edit3,
  Trash2,
  X,
  Percent,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { cn, formatPrice, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

function SkeletonRow() {
  return (
    <tr className="border-b border-muted-50">
      <td className="px-6 py-4"><div className="h-4 w-20 animate-pulse rounded bg-muted-200" /></td>
      <td className="hidden px-6 py-4 md:table-cell"><div className="h-4 w-32 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-16 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-20 animate-pulse rounded bg-muted-200" /></td>
      <td className="hidden px-6 py-4 lg:table-cell"><div className="h-4 w-16 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-16 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-16 animate-pulse rounded bg-muted-200" /></td>
    </tr>
  );
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [form, setForm] = useState({
    code: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    minimumOrderAmount: '',
    usageLimit: '',
    startsAt: '',
    expiresAt: '',
  });

  const fetchCoupons = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/v1/admin/coupons?${params}`);
      const data = await res.json();
      if (data.success) {
        setCoupons(data.data);
        setTotalPages(data.meta?.totalPages || 1);
        setTotalItems(data.meta?.totalItems || 0);
      } else {
        toast.error(data.error || 'Failed to load coupons');
      }
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons(currentPage);
  }, [currentPage]);

  const resetForm = () => {
    setForm({ code: '', description: '', type: 'percentage', value: '', minimumOrderAmount: '', usageLimit: '', startsAt: '', expiresAt: '' });
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!form.code || !form.value || !form.startsAt || !form.expiresAt) {
      toast.error('Code, value, start and expiry dates are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          description: form.description,
          type: form.type,
          value: Number(form.value),
          minimumOrderAmount: form.minimumOrderAmount ? Number(form.minimumOrderAmount) : undefined,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
          startsAt: form.startsAt,
          expiresAt: form.expiresAt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Coupon created');
        setShowForm(false);
        resetForm();
        fetchCoupons(currentPage);
      } else {
        toast.error(data.error || 'Failed to create coupon');
      }
    } catch {
      toast.error('Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (form.code) body.code = form.code;
      if (form.description) body.description = form.description;
      if (form.type) body.type = form.type;
      if (form.value) body.value = Number(form.value);
      if (form.minimumOrderAmount) body.minimumOrderAmount = Number(form.minimumOrderAmount);
      if (form.usageLimit) body.usageLimit = Number(form.usageLimit);
      if (form.startsAt) body.startsAt = form.startsAt;
      if (form.expiresAt) body.expiresAt = form.expiresAt;

      const res = await fetch(`/api/v1/admin/coupons/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Coupon updated');
        setShowForm(false);
        resetForm();
        fetchCoupons(currentPage);
      } else {
        toast.error(data.error || 'Failed to update coupon');
      }
    } catch {
      toast.error('Failed to update coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`/api/v1/admin/coupons/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Coupon deleted');
        fetchCoupons(currentPage);
      } else {
        toast.error(data.error || 'Failed to delete coupon');
      }
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const startEdit = (coupon: any) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code || '',
      description: coupon.description || '',
      type: coupon.type || 'percentage',
      value: String(coupon.value || ''),
      minimumOrderAmount: String(coupon.minimum_order_amount || ''),
      usageLimit: String(coupon.usage_limit || ''),
      startsAt: coupon.starts_at ? coupon.starts_at.split('T')[0] : '',
      expiresAt: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Coupons Management</h1>
          <p className="text-sm text-muted-500">Create and manage discount coupons</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); resetForm(); }}>
          <Plus className="h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{loading ? '...' : totalItems}</p>
              <p className="text-xs text-muted-500">Total Coupons</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 text-success-600">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">
                {loading ? '...' : coupons.filter((c) => c.is_active).length}
              </p>
              <p className="text-xs text-muted-500">Active</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-100 text-danger-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">
                {loading ? '...' : coupons.filter((c) => !c.is_active).length}
              </p>
              <p className="text-xs text-muted-500">Expired/Inactive</p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-800">{editingId ? 'Edit Coupon' : 'Create New Coupon'}</h2>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="rounded-lg p-1 text-muted-500 hover:bg-muted-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SUMMER20"
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm uppercase text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short description"
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'percentage' | 'fixed' })}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-700 focus:border-primary focus:outline-none"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₨)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Value *</label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Min Order Amount</label>
              <input
                type="number"
                value={form.minimumOrderAmount}
                onChange={(e) => setForm({ ...form, minimumOrderAmount: e.target.value })}
                placeholder="Optional"
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Usage Limit</label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                placeholder="Unlimited"
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Starts At *</label>
              <input
                type="date"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-700 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Expires At *</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-700 focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={editingId ? handleUpdate : handleCreate} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Coupon' : 'Create Coupon'}
            </Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100 bg-muted-50">
                <th className="px-6 py-3 font-medium text-muted-600">Code</th>
                <th className="hidden px-6 py-3 font-medium text-muted-600 md:table-cell">Description</th>
                <th className="px-6 py-3 font-medium text-muted-600">Type</th>
                <th className="px-6 py-3 font-medium text-muted-600">Value</th>
                <th className="hidden px-6 py-3 font-medium text-muted-600 lg:table-cell">Status</th>
                <th className="px-6 py-3 font-medium text-muted-600">Expires</th>
                <th className="px-6 py-3 font-medium text-muted-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : coupons.length === 0
                  ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <Tag className="mx-auto mb-3 h-10 w-10 text-muted-300" />
                          <p className="text-sm text-muted-500">No coupons yet</p>
                        </td>
                      </tr>
                    )
                  : coupons.map((coupon: any) => {
                      const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                      return (
                        <tr key={coupon.id} className="hover:bg-muted-50/50">
                          <td className="px-6 py-4 font-mono font-bold text-secondary-800">{coupon.code}</td>
                          <td className="hidden px-6 py-4 text-muted-600 md:table-cell">{coupon.description || '-'}</td>
                          <td className="px-6 py-4">
                            <Badge variant={coupon.type === 'percentage' ? 'primary' : 'success'} size="sm">
                              {coupon.type === 'percentage' ? `${coupon.value}%` : formatPrice(coupon.value)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 font-medium text-secondary-800">
                            {coupon.type === 'percentage' ? `${coupon.value}% off` : `${formatPrice(coupon.value)} off`}
                          </td>
                          <td className="hidden px-6 py-4 lg:table-cell">
                            <Badge variant={isExpired ? 'danger' : coupon.is_active ? 'success' : 'default'} size="sm">
                              {isExpired ? 'Expired' : coupon.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-muted-600">
                            {coupon.expires_at ? formatDate(coupon.expires_at) : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEdit(coupon)}
                                className="rounded p-1.5 text-muted-500 transition-colors hover:bg-primary-50 hover:text-primary"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(coupon.id)}
                                className="rounded p-1.5 text-muted-500 transition-colors hover:bg-danger-50 hover:text-danger"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-muted-100 px-6 py-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={cn(
                  'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                  currentPage === p
                    ? 'bg-primary text-white'
                    : 'text-muted-600 hover:bg-muted-50'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
