'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Camera, Store, Loader2, MapPin, Mail, Phone } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { resolveImage } from '@/lib/imageLoader';

interface VendorProfile {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  contact_email: string;
  contact_phone?: string | null;
  address?: string | null;
}

export default function SellerProfilePage() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    logoUrl: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoForDisplay = resolveImage(form.logoUrl);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/seller/profile');
      const json = await res.json();
      if (json.success) {
        const v: VendorProfile = json.data;
        setForm({
          name: v.name || '',
          description: v.description || '',
          logoUrl: v.logo_url || '',
          contactEmail: v.contact_email || '',
          contactPhone: v.contact_phone || '',
          address: v.address || '',
        });
      } else {
        toast.error(json.error || 'Failed to load profile');
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('bucket', 'vendor-assets');
      body.append('folder', 'logos');
      const res = await fetch('/api/v1/uploads', { method: 'POST', body });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Upload failed');
      setForm((prev) => ({ ...prev, logoUrl: json.data.url }));
      toast.success('Logo uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.contactEmail) {
      toast.error('Store name and email are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/v1/seller/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          logoUrl: form.logoUrl,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          address: form.address,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Save failed');
      toast.success(json.message || 'Profile saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
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
        <h2 className="text-2xl font-bold text-secondary-800">Profile Settings</h2>
        <p className="text-sm text-muted-500">Manage your store information</p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-secondary-800">Store Information</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-secondary-800">Store Logo</label>
            <div
              onClick={() => logoInputRef.current?.click()}
              className="group flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-muted-200 transition-colors hover:border-primary"
            >
              {logoForDisplay ? (
                <Image
                  src={logoForDisplay}
                  alt="Store Logo"
                  width={120}
                  height={120}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <Camera className="mx-auto mb-1 h-6 w-6 text-muted-400 group-hover:text-primary" />
                  <p className="text-[10px] text-muted-400">
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </p>
                </div>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Store Name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-secondary-800">
              Store Description
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <Input
              label="Contact Email"
              type="email"
              icon={<Mail className="pointer-events-none h-4 w-4 text-muted-400" />}
              value={form.contactEmail}
              onChange={(e) => updateField('contactEmail', e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Contact Phone"
              icon={<Phone className="pointer-events-none h-4 w-4 text-muted-400" />}
              value={form.contactPhone}
              onChange={(e) => updateField('contactPhone', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Store Address"
              icon={<MapPin className="pointer-events-none h-4 w-4 text-muted-400" />}
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
