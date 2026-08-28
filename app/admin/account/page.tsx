'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, User, Shield, Mail, KeyRound, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export default function AdminAccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    fetch('/api/v1/auth/profile')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setProfile(json.data);
          setFirstName(json.data.firstName || '');
          setLastName(json.data.lastName || '');
          setPhone(json.data.phone || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone: phone || null }),
      });
      const json = await res.json();
      if (json.success) {
        setProfile((p) => (p ? { ...p, firstName, lastName, phone } : p));
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
        setMessage({ type: 'error', text: json.error || 'Update failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPw(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setMessage({ type: 'error', text: json.error || 'Change failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Change failed' });
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">My Account</h1>
        <p className="text-sm text-muted-500">Manage your admin account and security</p>
      </div>

      {message && (
        <div
          className={
            message.type === 'success'
              ? 'rounded-lg bg-success-50 p-3 text-sm text-success'
              : 'rounded-lg bg-danger-50 p-3 text-sm text-danger'
          }
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Profile summary */}
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <User className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-bold text-secondary-800">
                  {profile?.firstName} {profile?.lastName}
                </p>
                <p className="flex items-center gap-1 text-sm text-muted-500">
                  <Mail className="h-3.5 w-3.5" /> {profile?.email}
                </p>
                <div className="mt-2">
                  <Badge variant="primary" size="sm">
                    <Shield className="mr-1 h-3 w-3" /> {(profile?.role || '').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-3 border-t border-muted-100 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-500">Member since</span>
                <span className="font-medium text-secondary-800">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString('en-PK', {
                        year: 'numeric',
                        month: 'long',
                      })
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-500">Email verified</span>
                <Badge variant={profile?.isEmailVerified ? 'success' : 'warning'} size="sm">
                  {profile?.isEmailVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Profile edit + password */}
        <div className="space-y-6 lg:col-span-3">
          <form onSubmit={saveProfile} className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-secondary-800">Profile Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="mt-4">
              <Input
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 0000000"
              />
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-secondary-800">Email</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-muted-200 bg-muted-50 px-3 py-2 text-sm text-muted-500"
              />
              <p className="mt-1 text-xs text-muted-500">
                Email cannot be changed from here.
              </p>
            </div>
            <div className="mt-6">
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </form>

          <form onSubmit={changePassword} className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-secondary-800">
              <KeyRound className="h-5 w-5 text-primary" />
              Change Password
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-400 hover:text-secondary"
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                  New Password
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <p className="text-xs text-muted-500">
                At least 8 characters with one uppercase, one lowercase and one number.
              </p>
            </div>
            <div className="mt-6">
              <Button variant="primary" type="submit" disabled={changingPw}>
                {changingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
