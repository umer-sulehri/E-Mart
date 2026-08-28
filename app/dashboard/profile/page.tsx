'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { resolveImage } from '@/lib/imageLoader';

export default function ProfilePage() {
  const { user, setUser, updateUser } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/auth/me');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
          setFirstName(data.data.firstName || '');
          setLastName(data.data.lastName || '');
          setPhone(data.data.phone || '');
          setDateOfBirth(data.data.dateOfBirth || '');
          setProfileImageUrl(data.data.profileImageUrl || '');
        }
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router, setUser]);

  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();

  const handleSave = async () => {
    if (!firstName || !lastName) {
      toast.error('First and last name are required');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/v1/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone, dateOfBirth }),
      });
      const data = await res.json();

      if (data.success) {
        updateUser({ firstName, lastName, phone, dateOfBirth });
        toast.success('Profile updated successfully');
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('bucket', 'avatars');
      body.append('folder', 'users');
      const res = await fetch('/api/v1/uploads', { method: 'POST', body });
      const upload = await res.json();
      if (!upload.success) throw new Error(upload.error || 'Upload failed');

      const saveRes = await fetch('/api/v1/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImageUrl: upload.data.url }),
      });
      const save = await saveRes.json();
      if (!save.success) throw new Error(save.error || 'Failed to save photo');

      setProfileImageUrl(upload.data.url);
      updateUser({ profileImageUrl: upload.data.url });
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" width={180} height={28} />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-6">
            <Skeleton variant="circle" width={96} height={96} />
            <div className="space-y-2">
              <Skeleton variant="text" width={150} height={20} />
              <Skeleton variant="text" width={200} />
              <Skeleton variant="text" width={120} />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <Skeleton variant="text" width={180} height={24} className="mb-4" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton variant="rectangle" height={44} />
            <Skeleton variant="rectangle" height={44} />
            <Skeleton variant="rectangle" height={44} />
            <Skeleton variant="rectangle" height={44} />
          </div>
          <Skeleton variant="rectangle" height={36} className="mt-6 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-secondary-800">Profile Settings</h2>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary text-3xl font-bold text-white">
              {profileImageUrl ? (
                <Image
                  src={resolveImage(profileImageUrl)}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-colors hover:bg-muted-50"
              aria-label="Upload profile photo"
            >
              {avatarUploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-600" />
              ) : (
                <Camera className="h-4 w-4 text-muted-600" />
              )}
            </button>
          </div>
          <div>
            <p className="font-semibold text-secondary-800">
              {firstName} {lastName}
            </p>
            <p className="text-sm text-muted-500">
              {user?.email ?? ''}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
            >
              <Camera className="h-4 w-4" />
              {avatarUploading ? 'Uploading...' : 'Change Photo'}
            </Button>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-bold text-secondary-800">Personal Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First Name"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            label="Last Name"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-secondary-800">
              Email Address
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                disabled
                value={user?.email ?? ''}
                className="w-full rounded-lg border border-muted-200 bg-muted-50 px-3.5 py-2.5 text-sm text-muted-600"
              />
              <Badge variant="success">Verified</Badge>
            </div>
          </div>
          <Input
            label="Phone Number"
            placeholder="+92 300 1234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Date of Birth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </div>
        <div className="mt-6">
          <Button variant="primary" onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-danger-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-secondary-800">Danger Zone</h3>
        <p className="mt-1 text-sm text-muted-500">
          Permanently delete your account and all associated data.
        </p>
        <Button variant="danger" size="sm" className="mt-4">
          <Trash2 className="h-4 w-4" />
          Delete Account
        </Button>
      </div>
    </div>
  );
}
