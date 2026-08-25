'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Upload, Save, Store, Building2, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface ProfileForm {
  // Store Information
  storeName: string;
  storeDescription: string;
  storeLogo: string;
  storeBanner: string;
  // Business Information
  businessName: string;
  businessType: 'individual' | 'company';
  ntnNumber: string;
  phone: string;
  email: string;
  // Bank Account
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  iban: string;
}

const defaultForm: ProfileForm = {
  storeName: 'Fresh Mart',
  storeDescription: 'We provide the freshest groceries and daily essentials directly from farms to your doorstep. Quality products at competitive prices.',
  storeLogo: '',
  storeBanner: '',
  businessName: 'Fresh Mart Enterprises',
  businessType: 'company',
  ntnNumber: '1234567-8',
  phone: '+92-300-1234567',
  email: 'seller@freshmart.pk',
  accountHolder: 'Ahmed Khan',
  bankName: 'Habib Bank Limited (HBL)',
  accountNumber: '0123456789012345',
  iban: 'PK36SCBL0000001234567890',
};

export default function SellerProfilePage() {
  const { user } = useAuthStore();
  const [form, setForm] = useState<ProfileForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setLogoPreview(preview);
      updateField('storeLogo', preview);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setBannerPreview(preview);
      updateField('storeBanner', preview);
    }
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      alert('Profile updated successfully!');
      setSaving(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-secondary-800">Profile Settings</h2>
        <p className="text-sm text-muted-500">Manage your store and business information</p>
      </div>

      {/* Store Information */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-secondary-800">Store Information</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              label="Store Name"
              value={form.storeName}
              onChange={(e) => updateField('storeName', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-secondary-800">
              Store Description
            </label>
            <textarea
              rows={4}
              value={form.storeDescription}
              onChange={(e) => updateField('storeDescription', e.target.value)}
              className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Store Logo */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary-800">
              Store Logo
            </label>
            <div
              onClick={() => logoInputRef.current?.click()}
              className="group flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-muted-200 transition-colors hover:border-primary"
            >
              {logoPreview || form.storeLogo ? (
                <Image
                  src={logoPreview || form.storeLogo}
                  alt="Store Logo"
                  width={120}
                  height={120}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <Camera className="mx-auto mb-1 h-6 w-6 text-muted-400 group-hover:text-primary" />
                  <p className="text-[10px] text-muted-400">Upload Logo</p>
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

          {/* Store Banner */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary-800">
              Store Banner
            </label>
            <div
              onClick={() => bannerInputRef.current?.click()}
              className="group flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-muted-200 transition-colors hover:border-primary"
            >
              {bannerPreview || form.storeBanner ? (
                <Image
                  src={bannerPreview || form.storeBanner}
                  alt="Store Banner"
                  width={600}
                  height={150}
                  className="h-full w-full object-cover"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto mb-1 h-6 w-6 text-muted-400 group-hover:text-primary" />
                  <p className="text-[10px] text-muted-400">Upload Banner (1200 x 300 recommended)</p>
                </div>
              )}
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
            />
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
            <Building2 className="h-5 w-5 text-success" />
          </div>
          <h3 className="text-lg font-bold text-secondary-800">Business Information</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Input
            label="Business Name"
            value={form.businessName}
            onChange={(e) => updateField('businessName', e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary-800">
              Business Type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => updateField('businessType', 'individual')}
                className={cn(
                  'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                  form.businessType === 'individual'
                    ? 'border-primary bg-primary text-white'
                    : 'border-muted-200 text-muted-600 hover:bg-muted-50'
                )}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => updateField('businessType', 'company')}
                className={cn(
                  'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                  form.businessType === 'company'
                    ? 'border-primary bg-primary text-white'
                    : 'border-muted-200 text-muted-600 hover:bg-muted-50'
                )}
              >
                Company
              </button>
            </div>
          </div>
          <Input
            label="NTN Number (Pakistan Tax ID)"
            value={form.ntnNumber}
            onChange={(e) => updateField('ntnNumber', e.target.value)}
            placeholder="e.g. 1234567-8"
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
          />
          <div className="md:col-span-2">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bank Account Information */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100">
            <CreditCard className="h-5 w-5 text-warning" />
          </div>
          <h3 className="text-lg font-bold text-secondary-800">Bank Account Information</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Input
            label="Account Holder Name"
            value={form.accountHolder}
            onChange={(e) => updateField('accountHolder', e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary-800">Bank Name</label>
            <select
              value={form.bankName}
              onChange={(e) => updateField('bankName', e.target.value)}
              className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="Habib Bank Limited (HBL)">Habib Bank Limited (HBL)</option>
              <option value="United Bank Limited (UBL)">United Bank Limited (UBL)</option>
              <option value="Meezan Bank">Meezan Bank</option>
              <option value="Allied Bank Limited (ABL)">Allied Bank Limited (ABL)</option>
              <option value="Bank Alfalah">Bank Alfalah</option>
              <option value="JS Bank">JS Bank</option>
              <option value="Faysal Bank">Faysal Bank</option>
              <option value="JazzCash">JazzCash</option>
              <option value="Easypaisa">Easypaisa</option>
            </select>
          </div>
          <Input
            label="Account Number"
            value={form.accountNumber}
            onChange={(e) => updateField('accountNumber', e.target.value)}
          />
          <Input
            label="IBAN"
            value={form.iban}
            onChange={(e) => updateField('iban', e.target.value)}
            placeholder="PK36..."
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
