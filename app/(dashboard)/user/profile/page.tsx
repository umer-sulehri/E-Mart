'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { apiFetch } from '@/lib/api/client';
import { CheckCircleIcon, EditIcon } from '@/components/icons';

export default function UserProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await apiFetch<{ user: typeof user }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: profile.name, email: profile.email, phone: profile.phone }),
      });
      if (updated.user) setUser(updated.user);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-[16px] p-6" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 10px 25px rgba(255,196,63,0.3)' }}>
        <h1 className="text-3xl font-bold text-white mb-1">My Profile</h1>
        <p className="text-white/70">Manage your account information.</p>
      </div>

      {saved && (
        <div className="rounded-xl p-4 flex items-center gap-2" style={{ background: 'rgba(110,139,94,0.15)', color: '#6E8B5E' }}>
          <CheckCircleIcon className="w-5 h-5" /> Profile updated successfully!
        </div>
      )}

      {error && (
        <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(182,92,75,0.1)', color: 'var(--color-error)', border: '1px solid var(--color-error)' }}>
          {error}
        </div>
      )}

      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
            {profile.name.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{profile.name}</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{profile.email}</p>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2" style={{ background: 'rgba(255,196,63,0.15)', color: 'var(--color-primary)' }}>{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Buyer'}</span>
          </div>
        </div>
      </div>

      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '2px solid var(--color-primary)' }}>
          <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Personal Information</h3>
          <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: editing ? 'var(--color-primary)' : 'var(--color-surface-alt)', color: editing ? 'white' : 'var(--color-text-primary)', border: `1px solid ${editing ? 'var(--color-primary)' : 'var(--color-border)'}` }}>
            {saving ? 'Saving...' : editing ? <><CheckCircleIcon className="w-4 h-4" /> Save</> : <><EditIcon className="w-4 h-4" /> Edit</>}
          </button>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Full Name', key: 'name' as const, type: 'text' },
            { label: 'Email', key: 'email' as const, type: 'email' },
            { label: 'Phone', key: 'phone' as const, type: 'tel' },
          ].map(field => (
            <div key={field.key}>
              <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{field.label}</label>
              <input type={field.type} value={profile[field.key]} onChange={e => setProfile({ ...profile, [field.key]: e.target.value })} disabled={!editing} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-60" style={{ background: editing ? 'var(--color-bg)' : 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
