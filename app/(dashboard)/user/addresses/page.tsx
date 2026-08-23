'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import {
  useAddresses,
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
  AddressInput,
  SavedAddress,
} from '@/hooks/useAddresses';
import { CheckCircleIcon, TrashIcon, EditIcon } from '@/components/icons';

const emptyAddress: AddressInput = {
  label: 'Home',
  street: '',
  city: '',
  state: '',
  zip: '',
  country: 'Pakistan',
  phone: '',
  isDefault: false,
};

export default function AddressesPage() {
  const toast = useToast();
  const { data: addresses = [], isLoading } = useAddresses();
  const addAddress = useAddAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [form, setForm] = useState<AddressInput>(emptyAddress);

  const startEdit = (addr: SavedAddress) => {
    setEditing(addr);
    setForm({
      label: addr.label,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
      phone: addr.phone ?? '',
      isDefault: !!addr.isDefault,
    });
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyAddress);
  };

  const handleSave = async () => {
    if (!form.label.trim() || !form.street.trim() || !form.city.trim() || !form.state.trim() || !form.zip.trim() || !form.country.trim()) {
      toast.showToast('Please fill in all required address fields.', 'error');
      return;
    }
    try {
      if (editing) {
        await updateAddress.mutateAsync({ id: editing.id, ...form });
        toast.showToast('Address updated!', 'success');
      } else {
        await addAddress.mutateAsync(form);
        toast.showToast('Address added!', 'success');
      }
      resetForm();
    } catch (err) {
      toast.showToast(err instanceof Error ? err.message : 'Failed to save address.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAddress.mutateAsync(id);
      toast.showToast('Address removed.', 'success');
      if (editing?.id === id) resetForm();
    } catch {
      toast.showToast('Failed to remove address.', 'error');
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all";
  const inputStyle = { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' };
  const saving = addAddress.isPending || updateAddress.isPending;

  const fields: { label: string; key: keyof AddressInput; placeholder: string; span?: boolean }[] = [
    { label: 'Label', key: 'label', placeholder: 'Home, Office, etc.' },
    { label: 'Phone', key: 'phone', placeholder: '+92 300 1234567' },
    { label: 'Street Address', key: 'street', placeholder: '123 Main Street', span: true },
    { label: 'City', key: 'city', placeholder: 'Lahore' },
    { label: 'State / Province', key: 'state', placeholder: 'Punjab' },
    { label: 'ZIP Code', key: 'zip', placeholder: '54000' },
    { label: 'Country', key: 'country', placeholder: 'Pakistan' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-[16px] p-6" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 10px 25px rgba(122,155,118,0.3)' }}>
        <h1 className="text-3xl font-bold text-white mb-1">My Addresses</h1>
        <p className="text-white/70">Manage your shipping addresses.</p>
      </div>

      {/* Address Form */}
      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>{editing ? 'Edit Address' : 'Add New Address'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.key} className={f.span ? 'sm:col-span-2' : ''}>
              <label htmlFor={`af-${f.key}`} className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{f.label}</label>
              <input
                id={`af-${f.key}`}
                value={(form[f.key] as string) ?? ''}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input id="af-default" type="checkbox" checked={!!form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="af-default" className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Set as default</label>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={handleSave} disabled={saving} className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
            {saving ? 'Saving...' : editing ? 'Update Address' : 'Add Address'}
          </button>
          {editing && <button onClick={resetForm} className="px-6 py-3 rounded-full text-sm font-semibold border border-border hover:bg-surface-alt transition-colors" style={{ color: 'var(--color-text-primary)' }}>Cancel</button>}
        </div>
      </div>

      {/* Address List */}
      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Saved Addresses</h3>
        {isLoading ? <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p> : addresses.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>No addresses saved yet.</p>
        ) : (
          <div className="space-y-3">
            {addresses.map(addr => (
              <div key={addr.id} className="p-4 rounded-xl border" style={{ borderColor: addr.isDefault ? 'var(--color-primary)' : 'var(--color-border)', background: addr.isDefault ? 'rgba(122,155,118,0.05)' : 'var(--color-bg)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{addr.label}</span>
                      {addr.isDefault && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--color-primary)', color: 'white' }}>Default</span>}
                    </div>
                    {addr.phone && (
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{addr.phone}</p>
                    )}
                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {addr.street}, {addr.city}, {addr.state} {addr.zip}, {addr.country}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(addr)} aria-label={`Edit ${addr.label}`} className="min-w-[40px] h-[40px] flex items-center justify-center rounded-lg border border-border hover:bg-surface-alt transition-colors"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(addr.id)} aria-label={`Delete ${addr.label}`} className="min-w-[40px] h-[40px] flex items-center justify-center rounded-lg border border-border hover:bg-error/10 hover:text-error transition-colors"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(addAddress.isError || updateAddress.isError) && (
        <div className="rounded-xl p-4 flex items-center gap-2 text-sm" style={{ background: 'rgba(182,92,75,0.1)', color: 'var(--color-error)' }}>
          <CheckCircleIcon className="w-5 h-5" /> Could not reach the address service. Please try again.
        </div>
      )}
    </div>
  );
}
