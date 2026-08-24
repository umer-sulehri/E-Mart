'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { CheckCircleIcon } from '@/components/icons';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setSaving(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-60";
  const inputStyle = { background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="rounded-[16px] p-6" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 10px 25px rgba(255,196,63,0.3)' }}>
        <h1 className="text-3xl font-bold text-white mb-1">Change Password</h1>
        <p className="text-white/70">Update your account password.</p>
      </div>

      {success && (
        <div className="rounded-xl p-4 flex items-center gap-2" style={{ background: 'rgba(110,139,94,0.15)', color: '#6E8B5E' }}>
          <CheckCircleIcon className="w-5 h-5" /> Password changed successfully!
        </div>
      )}

      {error && (
        <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(182,92,75,0.1)', color: 'var(--color-error)', border: '1px solid var(--color-error)' }}>
          {error}
        </div>
      )}

      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass} style={inputStyle} required />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} style={inputStyle} required minLength={6} />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Minimum 6 characters</p>
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} style={inputStyle} required />
          </div>
          <button type="submit" disabled={saving} className="w-full py-3 rounded-full text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
            {saving ? 'Saving...' : 'Change Password'}
          </button>
        </form>
      </div>

      <Link href="/user/profile" className="block text-center text-sm font-semibold" style={{ color: 'var(--color-primary-dark)' }}>
        ← Back to Profile
      </Link>
    </div>
  );
}
