'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { CheckCircleIcon, TrashIcon, EditIcon } from '@/components/icons';

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  city: string;
  province: string;
  zipCode: string;
  isDefault: boolean;
}

const emptyAddress: Omit<Address, 'id'> = { label: 'Home', fullName: '', phone: '', addressLine1: '', city: '', province: '', zipCode: '', isDefault: false };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<Omit<Address, 'id'>>(emptyAddress);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAddresses = async () => {
    try {
      const data = await apiFetch<{ addresses: Address[] }>('/auth/addresses');
      setAddresses(data.addresses || []);
    } catch { setAddresses([]); } finally { setLoading(false); }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{ addresses: Address[] }>('/auth/addresses');
        if (!cancelled) setAddresses(data.addresses || []);
      } catch {
        if (!cancelled) setAddresses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      if (editing) {
        await apiFetch(`/auth/addresses/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await apiFetch('/auth/addresses', { method: 'POST', body: JSON.stringify(form) });
      }
      setSuccess(editing ? 'Address updated!' : 'Address added!');
      setEditing(null); setForm(emptyAddress);
      await fetchAddresses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/auth/addresses/${id}`, { method: 'DELETE' });
      await fetchAddresses();
    } catch {}
  };

  const startEdit = (addr: Address) => { setEditing(addr); setForm({ label: addr.label, fullName: addr.fullName, phone: addr.phone, addressLine1: addr.addressLine1, city: addr.city, province: addr.province, zipCode: addr.zipCode, isDefault: addr.isDefault }); };

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all";
  const inputStyle = { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-[16px] p-6" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 10px 25px rgba(122,155,118,0.3)' }}>
        <h1 className="text-3xl font-bold text-white mb-1">My Addresses</h1>
        <p className="text-white/70">Manage your shipping addresses.</p>
      </div>

      {success && <div className="rounded-xl p-4 flex items-center gap-2" style={{ background: 'rgba(110,139,94,0.15)', color: '#6E8B5E' }}><CheckCircleIcon className="w-5 h-5" /> {success}</div>}
      {error && <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(182,92,75,0.1)', color: 'var(--color-error)', border: '1px solid var(--color-error)' }}>{error}</div>}

      {/* Address Form */}
      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>{editing ? 'Edit Address' : 'Add New Address'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Label', key: 'label' as const, placeholder: 'Home, Office, etc.' },
            { label: 'Full Name', key: 'fullName' as const, placeholder: 'Ahmed Khan' },
            { label: 'Phone', key: 'phone' as const, placeholder: '+92 300 1234567' },
            { label: 'Address', key: 'addressLine1' as const, placeholder: '123 Main Street', span: true },
            { label: 'City', key: 'city' as const, placeholder: 'Lahore' },
            { label: 'Province', key: 'province' as const, placeholder: 'Punjab' },
            { label: 'ZIP Code', key: 'zipCode' as const, placeholder: '54000' },
          ].map(f => (
            <div key={f.key} className={f.span ? 'sm:col-span-2' : ''}>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{f.label}</label>
              <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} className={inputClass} style={inputStyle} />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="w-4 h-4" />
            <label className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Set as default</label>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={handleSave} disabled={saving} className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
            {saving ? 'Saving...' : editing ? 'Update Address' : 'Add Address'}
          </button>
          {editing && <button onClick={() => { setEditing(null); setForm(emptyAddress); }} className="px-6 py-3 rounded-full text-sm font-semibold border border-border hover:bg-surface-alt transition-colors" style={{ color: 'var(--color-text-primary)' }}>Cancel</button>}
        </div>
      </div>

      {/* Address List */}
      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Saved Addresses</h3>
        {loading ? <p className="text-text-secondary">Loading...</p> : addresses.length === 0 ? (
          <p className="text-text-secondary text-center py-8">No addresses saved yet.</p>
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
                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{addr.fullName} — {addr.phone}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{addr.addressLine1}, {addr.city}, {addr.province} {addr.zipCode}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(addr)} className="min-w-[40px] h-[40px] flex items-center justify-center rounded-lg border border-border hover:bg-surface-alt transition-colors"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(addr.id)} className="min-w-[40px] h-[40px] flex items-center justify-center rounded-lg border border-border hover:bg-error/10 hover:text-error transition-colors"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
