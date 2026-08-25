'use client';

import { useState } from 'react';
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
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface Address {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

const initialAddresses: Address[] = [
  {
    id: '1',
    label: 'Home',
    firstName: 'Ahmed',
    lastName: 'Khan',
    phone: '+92 300 1234567',
    addressLine1: '42 Liberty Avenue, Gulshan-e-Iqbal',
    addressLine2: 'Block 5, Near Safari Park',
    city: 'Karachi',
    province: 'Sindh',
    postalCode: '75300',
    isDefault: true,
  },
  {
    id: '2',
    label: 'Office',
    firstName: 'Ahmed',
    lastName: 'Khan',
    phone: '+92 321 7654321',
    addressLine1: 'Suite 801, Tech Plaza, Shahrah-e-Faisal',
    addressLine2: 'Building C',
    city: 'Karachi',
    province: 'Sindh',
    postalCode: '75400',
    isDefault: false,
  },
  {
    id: '3',
    label: 'Other',
    firstName: 'Ahmed',
    lastName: 'Khan',
    phone: '+92 333 9876543',
    addressLine1: '15 Main Boulevard, DHA Phase 5',
    addressLine2: '',
    city: 'Lahore',
    province: 'Punjab',
    postalCode: '54000',
    isDefault: false,
  },
];

const emptyForm: Omit<Address, 'id'> = {
  label: 'Home',
  firstName: '',
  lastName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  province: '',
  postalCode: '',
  isDefault: false,
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
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Address, 'id'>>(emptyForm);

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({ ...addr });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.firstName || !form.addressLine1 || !form.city) return;

    if (form.isDefault) {
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: false }))
      );
    }

    if (editingId) {
      setAddresses((prev) =>
        prev.map((a) => (a.id === editingId ? { ...a, ...form } : a))
      );
    } else {
      setAddresses((prev) => [
        ...prev,
        { ...form, id: Date.now().toString() },
      ]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const setDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-secondary-800">My Addresses</h2>
        <Button variant="primary" size="sm" onClick={startAdd}>
          <Plus className="h-4 w-4" />
          Add New Address
        </Button>
      </div>

      {/* Address Form */}
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
            {/* Label selector */}
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
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            />
            <Input
              label="Last Name"
              placeholder="Last name"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
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
              value={form.addressLine1}
              onChange={(e) =>
                setForm((f) => ({ ...f, addressLine1: e.target.value }))
              }
              className="sm:col-span-2"
            />
            <Input
              label="Address Line 2 (optional)"
              placeholder="Apartment, suite, etc."
              value={form.addressLine2}
              onChange={(e) =>
                setForm((f) => ({ ...f, addressLine2: e.target.value }))
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
              value={form.province}
              onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
            />
            <Input
              label="Postal Code"
              placeholder="Postal code"
              value={form.postalCode}
              onChange={(e) =>
                setForm((f) => ({ ...f, postalCode: e.target.value }))
              }
            />

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-secondary-800">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isDefault: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary"
                />
                Set as default
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="primary" onClick={handleSave}>
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

      {/* Address Cards */}
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
                  addr.isDefault && 'ring-2 ring-primary'
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
                    {addr.isDefault && (
                      <Badge variant="success" size="sm">
                        Default
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm font-medium text-secondary-800">
                  {addr.firstName} {addr.lastName}
                </p>
                <p className="mt-1 text-sm text-muted-600 leading-relaxed">
                  {addr.addressLine1}
                  {addr.addressLine2 && <>, {addr.addressLine2}</>}
                  <br />
                  {addr.city}, {addr.province} {addr.postalCode}
                </p>
                <p className="mt-1 text-sm text-muted-600">{addr.phone}</p>

                <div className="mt-4 flex gap-2 border-t border-muted-100 pt-3">
                  {!addr.isDefault && (
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
                    className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:text-danger-600"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
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
