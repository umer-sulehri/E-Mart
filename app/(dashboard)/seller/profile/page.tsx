'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { useSellerProfile, useUpdateSellerProfile } from '@/hooks/useSeller';
import { useToast } from '@/components/ui/Toast';
import { CheckCircleIcon, EditIcon, XCircleIcon } from '@/components/icons';

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  storeName: string;
  storeDescription: string;
  businessAddress: string;
}

type ProfileField = keyof ProfileForm;

export default function SellerProfilePage() {
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const { data: serverProfile } = useSellerProfile();
  const updateProfile = useUpdateSellerProfile();

  const [editing, setEditing] = useState(false);
  // Only user modifications are stored; everything else derives from the
  // server profile. This avoids syncing effects entirely.
  const [edits, setEdits] = useState<Partial<Record<ProfileField, string>>>({});

  const base: ProfileForm = {
    name: serverProfile?.name ?? user?.name ?? '',
    email: serverProfile?.email ?? user?.email ?? '',
    phone: serverProfile?.phone ?? '',
    storeName: serverProfile?.storeName ?? '',
    storeDescription: serverProfile?.storeDescription ?? '',
    businessAddress: serverProfile?.businessAddress ?? '',
  };

  const profile: ProfileForm = { ...base, ...edits };

  const startEditing = () => setEdits({ ...profile });
  const cancelEditing = () => setEdits({});

  const handleSave = async () => {
    if (!profile.name.trim()) {
      toast.showToast('Full name is required.', 'error');
      return;
    }
    try {
      await updateProfile.mutateAsync({
        name: profile.name.trim(),
        phone: profile.phone.trim() || undefined,
        storeName: profile.storeName,
        storeDescription: profile.storeDescription,
        businessAddress: profile.businessAddress,
      });
      toast.showToast('Profile updated successfully!', 'success');
      setEdits({});
      setEditing(false);
    } catch (err) {
      toast.showToast(err instanceof Error ? err.message : 'Failed to save profile.', 'error');
    }
  };

  const fields: { label: string; key: ProfileField; type: string }[] = [
    { label: 'Full Name', key: 'name', type: 'text' },
    { label: 'Email', key: 'email', type: 'email' },
    { label: 'Phone', key: 'phone', type: 'tel' },
    { label: 'Store Name', key: 'storeName', type: 'text' },
    { label: 'Business Address', key: 'businessAddress', type: 'text' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-[16px] p-6" style={{ background: 'linear-gradient(135deg, #6B4E35, #3B2A1A)', boxShadow: '0 10px 25px rgba(217,176,140,0.3)' }}>
        <h1 className="text-3xl font-bold text-white mb-1">Store Profile</h1>
        <p className="text-white/70">Manage your seller and store information.</p>
      </div>

      {/* Avatar Section */}
      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #6B4E35, #3B2A1A)' }}>
            {(profile.storeName || profile.name).charAt(0).toUpperCase() || 'S'}
          </div>
          <div>
            <p className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{profile.storeName || profile.name}</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{profile.email}</p>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2" style={{ background: 'rgba(217,176,140,0.18)', color: 'var(--color-primary-dark)' }}>Seller</span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '2px solid var(--color-primary)' }}>
          <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Personal &amp; Store Information</h3>
          {editing ? (
            <div className="flex gap-2">
              <button
                onClick={() => { cancelEditing(); setEditing(false); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                <XCircleIcon className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: 'var(--color-primary)', color: 'white', border: '1px solid var(--color-primary)' }}
              >
                <CheckCircleIcon className="w-4 h-4" /> {updateProfile.isPending ? 'Savingâ€¦' : 'Save'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => { startEditing(); setEditing(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              <EditIcon className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
        <div className="space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              <label htmlFor={`sp-${field.key}`} className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{field.label}</label>
              <input
                id={`sp-${field.key}`}
                type={field.type}
                value={profile[field.key]}
                onChange={e => setEdits(prev => ({ ...prev, [field.key]: e.target.value }))}
                disabled={!editing || field.key === 'email'}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-60"
                style={{ background: editing ? 'var(--color-bg)' : 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>
          ))}
          <div>
            <label htmlFor="sp-desc" className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Store Description</label>
            <textarea
              id="sp-desc"
              rows={3}
              value={profile.storeDescription}
              onChange={e => setEdits(prev => ({ ...prev, storeDescription: e.target.value }))}
              disabled={!editing}
              placeholder="Tell customers about your storeâ€¦"
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 resize-vertical disabled:opacity-60"
              style={{ background: editing ? 'var(--color-bg)' : 'var(--color-surface-alt)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>
          {!editing && (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Email changes require contacting support.</p>
          )}
        </div>
      </div>
    </div>
  );
}


