'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Home,
  Briefcase,
  Building2,
  X,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

interface Address {
  id: string;
  label: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  label: 'Home',
  first_name: '',
  last_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'Pakistan',
  is_default: false,
};

const labelIcons: Record<string, typeof Home> = {
  Home: Home,
  Office: Briefcase,
  Other: Building2,
};

const labelColors: Record<string, string> = {
  Home: 'bg-primary-100 text-primary-700',
  Office: 'bg-info-100 text-info-700',
  Other: 'bg-muted-100 text-muted-700',
};

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated, user, setUser } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/auth/addresses');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.success) {
          setAddresses(Array.isArray(data.data) ? data.data : []);
        } else {
          toast.error(data.error || 'Failed to load addresses');
        }
      } catch {
        toast.error('Failed to load addresses');
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [router, setUser, isAuthenticated]);

  const startAdd = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      first_name: user?.firstName || '',
      last_name: user?.lastName || '',
      phone: user?.phone || '',
    });
    setShowForm(true);
  };

  const startEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label || 'Home',
      first_name: addr.first_name,
      last_name: addr.last_name,
      phone: addr.phone || '',
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      city: addr.city,
      state: addr.state || '',
      postal_code: addr.postal_code || '',
      country: addr.country || 'Pakistan',
      is_default: addr.is_default,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.first_name || !form.address_line1 || !form.city) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      setSaving(true);

      let res: Response;
      if (editingId) {
        res = await fetch(`/api/v1/auth/addresses/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch('/api/v1/auth/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }

      const data = await res.json();

      if (data.success) {
        toast.success(editingId ? 'Address updated' : 'Address added');
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        await refreshAddresses();
      } else {
        toast.error(data.error || 'Failed to save address');
      }
    } catch {
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const refreshAddresses = async () => {
    try {
      const res = await fetch('/api/v1/auth/addresses');
      const data = await res.json();
      if (data.success) {
        setAddresses(Array.isArray(data.data) ? data.data : []);
      }
    } catch {
      // silently ignore refresh failure
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/v1/auth/addresses/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Address deleted');
        await refreshAddresses();
      } else {
        toast.error(data.error || 'Failed to delete address');
      }
    } catch {
      toast.error('Failed to delete address');
    } finally {
      setDeletingId(null);
    }
  };

  const setDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/auth/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      });
      const data = await res.json();

      if (data.success) {
        await refreshAddresses();
        toast.success('Default address updated');
      } else {
        toast.error(data.error || 'Failed to update default');
      }
    } catch {
      toast.error('Failed to update default address');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width={150} height={28} />
          <Skeleton variant="text" width={140} height={36} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white p-5 shadow-sm">
              <Skeleton variant="text" width={100} height={20} className="mb-3" />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="90%" className="mt-1" />
              <Skeleton variant="text" width="70%" className="mt-1" />
              <Skeleton variant="text" width="40%" className="mt-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-secondary-800">My Addresses</h2>
        <Button variant="primary" size="sm" onClick={startAdd}>
          <Plus className="h-4 w-4" />
          Add New Address
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-secondary-800">
              {editingId ? 'Edit Address' : 'New Address'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-lg p-1 hover:bg-muted-100"
            >
              <X className="h-5 w-5 text-muted-500" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                Address Type
              </label>
              <div className="flex gap-2">
                {['Home', 'Office', 'Other'].map((label) => (
                  <button
                    key={label}
                    onClick={() => setForm((f) => ({ ...f, label }))}
                    className={cn(
                      'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                      form.label === label
                        ? 'border-primary bg-primary-50 text-primary-600'
                        : 'border-muted-200 text-muted-600 hover:bg-muted-50'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="First Name"
              placeholder="First name"
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
            />
            <Input
              label="Last Name"
              placeholder="Last name"
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
            />
            <Input
              label="Phone Number"
              placeholder="+92 300 1234567"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Input
              label="Address Line 1"
              placeholder="Street address"
              value={form.address_line1}
              onChange={(e) =>
                setForm((f) => ({ ...f, address_line1: e.target.value }))
              }
              className="sm:col-span-2"
            />
            <Input
              label="Address Line 2 (optional)"
              placeholder="Apartment, suite, etc."
              value={form.address_line2}
              onChange={(e) =>
                setForm((f) => ({ ...f, address_line2: e.target.value }))
              }
              className="sm:col-span-2"
            />
            <Input
              label="City"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
            <Input
              label="Province"
              placeholder="Province"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            />
            <Input
              label="Postal Code"
              placeholder="Postal code"
              value={form.postal_code}
              onChange={(e) =>
                setForm((f) => ({ ...f, postal_code: e.target.value }))
              }
            />

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-secondary-800">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_default: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary"
                />
                Set as default
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="primary" onClick={handleSave} loading={saving}>
              <Check className="h-4 w-4" />
              {editingId ? 'Update Address' : 'Save Address'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <MapPin className="mx-auto h-12 w-12 text-muted-300" />
          <p className="mt-4 text-lg font-semibold text-secondary-800">
            No addresses saved
          </p>
          <p className="mt-1 text-sm text-muted-500">
            Add a delivery address to get started.
          </p>
          <Button variant="primary" className="mt-4" onClick={startAdd}>
            <Plus className="h-4 w-4" />
            Add Address
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => {
            const Icon = labelIcons[addr.label] || MapPin;
            return (
              <div
                key={addr.id}
                className={cn(
                  'rounded-xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md',
                  addr.is_default && 'ring-2 ring-primary'
                )}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        labelColors[addr.label] || labelColors.Other
                      )}
                    >
                      {addr.label}
                    </span>
                    {addr.is_default && (
                      <Badge variant="success" size="sm">
                        Default
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm font-medium text-secondary-800">
                  {addr.first_name} {addr.last_name}
                </p>
                <p className="mt-1 text-sm text-muted-600 leading-relaxed">
                  {addr.address_line1}
                  {addr.address_line2 && <>, {addr.address_line2}</>}
                  <br />
                  {addr.city}, {addr.state} {addr.postal_code}
                </p>
                <p className="mt-1 text-sm text-muted-600">{addr.phone}</p>

                <div className="mt-4 flex gap-2 border-t border-muted-100 pt-3">
                  {!addr.is_default && (
                    <button
                      onClick={() => setDefault(addr.id)}
                      className="text-xs font-medium text-primary hover:text-primary-500"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(addr)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-600 hover:text-secondary-800"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    disabled={deletingId === addr.id}
                    className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:text-danger-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    {deletingId === addr.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
