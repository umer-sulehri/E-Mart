'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { CheckCircleIcon, EditIcon } from '@/components/icons';

export default function SellerProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: 'Lahore, Pakistan',
    storeDescription: 'Premium electronics and accessories store.',
    businessName: user?.name || '',
    taxId: 'PK-12345',
  });

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-[16px] p-6" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 10px 25px rgba(122,155,118,0.3)' }}>
        <h1 className="text-3xl font-bold text-white mb-1">Seller Profile</h1>
        <p className="text-white/70">Manage your store information.</p>
      </div>

      {saved && (
        <div className="rounded-xl p-4 flex items-center gap-2" style={{ background: 'rgba(110,139,94,0.15)', color: '#6E8B5E' }}>
          <CheckCircleIcon className="w-5 h-5" /> Profile updated successfully!
        </div>
      )}

      {/* Avatar Section */}
      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
            {profile.name.charAt(0).toUpperCase() || 'S'}
          </div>
          <div>
            <p className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{profile.name}</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{profile.email}</p>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2" style={{ background: 'rgba(122,155,118,0.15)', color: 'var(--color-primary)' }}>{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Seller'}</span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '2px solid var(--color-primary)' }}>
          <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Personal Information</h3>
          <button onClick={() => editing ? handleSave() : setEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: editing ? 'var(--color-primary)' : 'var(--color-surface-alt)', color: editing ? 'white' : 'var(--color-text-primary)', border: `1px solid ${editing ? 'var(--color-primary)' : 'var(--color-border)'}` }}>
            {editing ? <><CheckCircleIcon className="w-4 h-4" /> Save</> : <><EditIcon className="w-4 h-4" /> Edit</>}
          </button>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Full Name', key: 'name' as const, type: 'text' },
            { label: 'Email', key: 'email' as const, type: 'email' },
            { label: 'Phone', key: 'phone' as const, type: 'tel' },
            { label: 'Address', key: 'address' as const, type: 'text' },
            { label: 'Business Name', key: 'businessName' as const, type: 'text' },
            { label: 'Tax ID', key: 'taxId' as const, type: 'text' },
          ].map(field => (
            <div key={field.key}>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{field.label}</label>
              <input type={field.type} value={profile[field.key]} onChange={e => setProfile({ ...profile, [field.key]: e.target.value })} disabled={!editing} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-60" style={{ background: editing ? 'var(--color-bg)' : 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            </div>
          ))}
          <div>
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Store Description</label>
            <textarea rows={3} value={profile.storeDescription} onChange={e => setProfile({ ...profile, storeDescription: e.target.value })} disabled={!editing} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 resize-vertical disabled:opacity-60" style={{ background: editing ? 'var(--color-bg)' : 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
