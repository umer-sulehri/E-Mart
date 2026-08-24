'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import {
  useAdminCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
  AdminCoupon,
} from '@/hooks/useAdminCoupons';
import { PlusIcon, EditIcon, TrashIcon, TagIcon } from '@/components/icons';

interface FormState {
  code: string;
  type: 'percent' | 'flat';
  value: string;
  minSubtotal: string;
  maxRedemptions: string;
  expiresAt: string;
}

const emptyForm: FormState = {
  code: '',
  type: 'percent',
  value: '',
  minSubtotal: '0',
  maxRedemptions: '',
  expiresAt: '',
};

export default function CouponsManagementPage() {
  const { showToast } = useToast();
  const { data: coupons, isLoading } = useAdminCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminCoupon | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return coupons ?? [];
    const q = search.trim().toLowerCase();
    return (coupons ?? []).filter((c) => c.code.toLowerCase().includes(q));
  }, [coupons, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (coupon: AdminCoupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minSubtotal: String(coupon.minSubtotal),
      maxRedemptions: coupon.maxRedemptions != null ? String(coupon.maxRedemptions) : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
    });
    setFormError('');
    setFormOpen(true);
  };

  const validate = (): Record<string, unknown> | null => {
    const value = Number(form.value);
    if (!form.code.trim()) return fail('Coupon code is required.');
    if (!/^[A-Za-z0-9_-]{2,32}$/.test(form.code.trim())) {
      return fail('Code may only contain letters, numbers, - and _ (2–32 chars).');
    }
    if (!(value > 0)) return fail('Discount value must be greater than zero.');
    if (form.type === 'percent' && value > 90) return fail('Percent discounts cannot exceed 90%.');
    if (!(Number(form.minSubtotal) >= 0)) return fail('Minimum subtotal cannot be negative.');
    const maxRed = form.maxRedemptions.trim()
      ? Number.parseInt(form.maxRedemptions, 10)
      : null;
    if (maxRed !== null && (!Number.isInteger(maxRed) || maxRed <= 0)) {
      return fail('Usage limit must be a positive whole number.');
    }
    return {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value,
      minSubtotal: Number(form.minSubtotal),
      maxRedemptions: maxRed,
      ...(form.expiresAt ? { expiresAt: new Date(`${form.expiresAt}T23:59:59`).toISOString() } : {}),
      isActive: editingId ? undefined : true,
    };
  };

  const fail = (msg: string): null => {
    setFormError(msg);
    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = validate();
    if (!payload) return;
    try {
      if (editingId) {
        await updateCoupon.mutateAsync({ id: editingId, data: payload });
        showToast('Coupon updated successfully', 'success');
      } else {
        await createCoupon.mutateAsync(payload);
        showToast('Coupon created successfully', 'success');
      }
      setFormOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save coupon.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCoupon.mutateAsync(deleteTarget.id);
      showToast('Coupon deleted', 'success');
      setDeleteTarget(null);
    } catch {
      showToast('Failed to delete coupon', 'error');
    }
  };

  const toggleActive = async (coupon: AdminCoupon) => {
    try {
      await updateCoupon.mutateAsync({ id: coupon.id, data: { isActive: !coupon.isActive } });
    } catch {
      showToast('Failed to update coupon', 'error');
    }
  };

  const formatDiscount = (c: AdminCoupon) =>
    c.type === 'percent' ? `${c.value}% off` : `Rs ${Number(c.value).toLocaleString()} off`;

  const formatExpiry = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString() : 'No expiry';

  const inputCls =
    'w-full h-[44px] rounded-[10px] border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <div className="min-h-screen bg-bg p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Coupons</h1>
            <p className="mt-1 text-text-secondary">
              Create discount codes that shoppers can apply in the cart.
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-[12px] min-h-[48px] min-w-[48px] bg-primary px-6 text-primary"
          >
            <PlusIcon className="h-5 w-5" />
            New Coupon
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6 rounded-[16px] bg-surface border border-border p-4">
          <Input
            label="Search coupons"
            placeholder="Search by code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-[48px] rounded-[10px] max-w-md"
          />
        </Card>

        {/* Table */}
        <Card className="rounded-[16px] bg-surface border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-primary-dark text-primary">
                  <th className="px-6 py-4 text-left text-sm font-semibold">Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Discount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Min. Subtotal</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Used / Limit</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Expires</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">
                      Loading coupons...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">
                      No coupons yet. Create one to run a promotion.
                    </td>
                  </tr>
                ) : (
                  filtered.map((coupon) => (
                    <tr key={coupon.id} className={`hover:bg-surface-alt transition-colors ${coupon.isActive ? '' : 'opacity-60'}`}>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 font-mono font-semibold text-text-primary">
                          <TagIcon className="h-4 w-4 text-primary" />
                          {coupon.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-primary">{formatDiscount(coupon)}</td>
                      <td className="px-6 py-4 text-text-secondary">
                        Rs {Number(coupon.minSubtotal).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {coupon.timesUsed} / {coupon.maxRedemptions ?? '∞'}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{formatExpiry(coupon.expiresAt)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActive(coupon)}
                          disabled={updateCoupon.isPending}
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                            coupon.isActive
                              ? 'bg-success/10 text-success border-success'
                              : 'bg-error/10 text-error border-error'
                          }`}
                          aria-label={coupon.isActive ? 'Deactivate coupon' : 'Activate coupon'}
                        >
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(coupon)}
                            className="flex h-12 w-12 items-center justify-center rounded-[8px] text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors"
                            aria-label={`Edit ${coupon.code}`}
                          >
                            <EditIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(coupon)}
                            className="flex h-12 w-12 items-center justify-center rounded-[8px] text-text-secondary hover:bg-error/10 hover:text-error transition-colors"
                            aria-label={`Delete ${coupon.code}`}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Create/Edit Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-lg rounded-[16px] bg-surface border border-border p-6 my-8">
            <h2 className="mb-4 text-xl font-bold text-text-primary">
              {editingId ? 'Edit Coupon' : 'New Coupon'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-text-secondary">Code *</label>
                  <Input
                    label=""
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="WELCOME10"
                    disabled={!!editingId}
                    className={`${inputCls} disabled:opacity-60`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-text-secondary">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as 'percent' | 'flat' })}
                    className={inputCls}
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="flat">Flat amount (Rs)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-text-secondary">
                    {form.type === 'percent' ? 'Percent off *' : 'Amount off (Rs) *'}
                  </label>
                  <Input
                    label=""
                    type="number"
                    min="0"
                    step={form.type === 'percent' ? '1' : '0.01'}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-text-secondary">Min. subtotal (Rs)</label>
                  <Input
                    label=""
                    type="number"
                    min="0"
                    value={form.minSubtotal}
                    onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-text-secondary">Usage limit</label>
                  <Input
                    label=""
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={form.maxRedemptions}
                    onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-text-secondary">Expiry date</label>
                  <Input
                    label=""
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              {formError && (
                <p className="rounded-lg p-3 text-sm" style={{ color: 'var(--color-error)', background: 'rgba(220,53,69,0.08)' }}>
                  {formError}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-[12px] min-h-[48px] min-w-[48px] bg-surface border border-border px-6 text-text-primary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCoupon.isPending || updateCoupon.isPending}
                  className="rounded-[12px] min-h-[48px] min-w-[48px] bg-primary px-6 text-primary disabled:opacity-50"
                >
                  {editingId ? 'Save Changes' : 'Create Coupon'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md rounded-[16px] bg-surface border border-border p-6">
            <h2 className="mb-2 text-xl font-bold text-text-primary">Delete Coupon</h2>
            <p className="mb-6 text-text-secondary">
              Delete <span className="font-mono font-medium text-text-primary">{deleteTarget.code}</span>?
              Shoppers will no longer be able to apply it. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setDeleteTarget(null)}
                className="rounded-[12px] min-h-[48px] min-w-[48px] bg-surface border border-border px-6 text-text-primary"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleteCoupon.isPending}
                className="rounded-[12px] min-h-[48px] min-w-[48px] bg-error px-6 text-error disabled:opacity-50"
              >
                {deleteCoupon.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
