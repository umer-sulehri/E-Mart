'use client';

import { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Tag,
  RefreshCw,
  X,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrder: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

const initialCoupons: Coupon[] = [
  { id: '1', code: 'SUMMER20', discountType: 'percentage', discountValue: 20, minOrder: 2000, usageLimit: 100, usedCount: 65, isActive: true, startDate: '2026-06-01', endDate: '2026-08-31' },
  { id: '2', code: 'WELCOME10', discountType: 'percentage', discountValue: 10, minOrder: 500, usageLimit: 500, usedCount: 312, isActive: true, startDate: '2026-01-01', endDate: '2026-12-31' },
  { id: '3', code: 'FLAT500', discountType: 'fixed', discountValue: 500, minOrder: 5000, usageLimit: 50, usedCount: 50, isActive: false, startDate: '2026-07-01', endDate: '2026-07-31' },
  { id: '4', code: 'NEWYEAR25', discountType: 'percentage', discountValue: 25, minOrder: 3000, usageLimit: 200, usedCount: 180, isActive: false, startDate: '2026-01-01', endDate: '2026-01-31' },
  { id: '5', code: 'FREEDELIVERY', discountType: 'fixed', discountValue: 250, minOrder: 1500, usageLimit: 300, usedCount: 145, isActive: true, startDate: '2026-08-01', endDate: '2026-09-30' },
  { id: '6', code: 'VIP30', discountType: 'percentage', discountValue: 30, minOrder: 10000, usageLimit: 20, usedCount: 8, isActive: true, startDate: '2026-08-01', endDate: '2026-08-31' },
  { id: '7', code: 'FIRST500', discountType: 'fixed', discountValue: 500, minOrder: 2500, usageLimit: 100, usedCount: 72, isActive: true, startDate: '2026-03-01', endDate: '2026-12-31' },
  { id: '8', code: 'EID15', discountType: 'percentage', discountValue: 15, minOrder: 1000, usageLimit: 150, usedCount: 150, isActive: false, startDate: '2026-04-01', endDate: '2026-04-10' },
];

const defaultForm = {
  code: '',
  discountType: 'percentage' as 'percentage' | 'fixed',
  discountValue: '',
  minOrder: '',
  usageLimit: '',
  startDate: '',
  endDate: '',
  isActive: true,
};

export default function SellerCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrder: String(coupon.minOrder),
      usageLimit: String(coupon.usageLimit),
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      isActive: coupon.isActive,
    });
    setShowForm(true);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm((prev) => ({ ...prev, code }));
  };

  const handleSave = () => {
    if (!form.code || !form.discountValue || !form.startDate || !form.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    const couponData: Coupon = {
      id: editingId || String(Date.now()),
      code: form.code.toUpperCase(),
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      minOrder: parseFloat(form.minOrder) || 0,
      usageLimit: parseInt(form.usageLimit) || 100,
      usedCount: editingId ? coupons.find((c) => c.id === editingId)?.usedCount || 0 : 0,
      isActive: form.isActive,
      startDate: form.startDate,
      endDate: form.endDate,
    };

    if (editingId) {
      setCoupons((prev) => prev.map((c) => (c.id === editingId ? couponData : c)));
    } else {
      setCoupons((prev) => [couponData, ...prev]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Create/Edit Form */}
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
                onChange={(e) => setForm((prev) => ({ ...prev, discountType: e.target.value as 'percentage' | 'fixed' }))}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (PKR)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                Discount Value {form.discountType === 'percentage' ? '(%)' : '(PKR)'}
              </label>
              <input
                type="number"
                min="0"
                value={form.discountValue}
                onChange={(e) => setForm((prev) => ({ ...prev, discountValue: e.target.value }))}
                placeholder="0"
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                  className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${
                    form.isActive ? 'bg-success' : 'bg-muted-300'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      form.isActive ? 'translate-x-5' : ''
                    }`}
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
            <Button onClick={handleSave}>
              {editingId ? 'Update Coupon' : 'Create Coupon'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Coupons Table */}
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
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-muted-50 transition-colors hover:bg-muted-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="font-mono font-semibold text-secondary-800">{coupon.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-secondary-800">
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}%`
                      : formatPrice(coupon.discountValue)}
                  </td>
                  <td className="px-6 py-4 text-muted-600">
                    {coupon.minOrder > 0 ? formatPrice(coupon.minOrder) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={coupon.usedCount >= coupon.usageLimit ? 'font-semibold text-danger' : 'text-secondary-800'}>
                      {coupon.usedCount}/{coupon.usageLimit}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={coupon.isActive ? 'success' : 'default'}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-600">{formatDate(coupon.endDate)}</td>
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
                        onClick={() => toggleActive(coupon.id)}
                        className="rounded-lg p-2 text-muted-600 transition-colors hover:bg-muted-100"
                        title={coupon.isActive ? 'Deactivate' : 'Activate'}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
