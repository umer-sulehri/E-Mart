'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  CreditCard,
  Truck,
  Share2,
  Mail,
  Save,
  Globe,
  Phone,
  MapPin,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type Tab = 'general' | 'payments' | 'shipping' | 'social' | 'email';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'social', label: 'Social Links', icon: Share2 },
  { id: 'email', label: 'Email', icon: Mail },
];

interface GeneralSettings {
  store_name: string;
  store_description: string;
  logo_url: string;
  contact_email: string;
  contact_phone: string;
  address: string;
}

interface PaymentSettings {
  stripe_enabled: boolean;
  easypaisa_enabled: boolean;
  jazzcash_enabled: boolean;
  cod_enabled: boolean;
  commission_rate: number;
}

interface ShippingSettings {
  free_shipping_threshold: number;
  standard_shipping_fee: number;
  estimated_delivery_days: number;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string;
  is_active: boolean;
  display_order: number;
}

interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_from_name: string;
  smtp_from_email: string;
  smtp_encryption: string;
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse rounded-lg bg-muted-200', className)} />
);

const SkeletonInput = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-10 w-full" />
  </div>
);

const SkeletonToggle = () => (
  <div className="flex items-center justify-between rounded-lg border border-muted-100 p-4">
    <div className="space-y-1">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
    <Skeleton className="h-6 w-11 rounded-full" />
  </div>
);

const ToggleSwitch = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={cn(
      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
      checked ? 'bg-primary' : 'bg-muted-300'
    )}
  >
    <span
      className={cn(
        'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
        checked ? 'translate-x-6' : 'translate-x-1'
      )}
    />
  </button>
);

const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) => (
  <div
    className={cn(
      'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg',
      type === 'success'
        ? 'bg-success text-white'
        : 'bg-danger text-white'
    )}
  >
    {type === 'success' ? (
      <CheckCircle className="h-5 w-5" />
    ) : (
      <AlertCircle className="h-5 w-5" />
    )}
    <span className="text-sm font-medium">{message}</span>
    <button onClick={onClose} className="ml-2 text-white/80 hover:text-white">
      ×
    </button>
  </div>
);

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const [generalLoading, setGeneralLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [shippingLoading, setShippingLoading] = useState(true);
  const [socialLoading, setSocialLoading] = useState(true);

  const [general, setGeneral] = useState<GeneralSettings>({
    store_name: '',
    store_description: '',
    logo_url: '',
    contact_email: '',
    contact_phone: '',
    address: '',
  });

  const [payments, setPayments] = useState<PaymentSettings>({
    stripe_enabled: true,
    easypaisa_enabled: true,
    jazzcash_enabled: true,
    cod_enabled: true,
    commission_rate: 5,
  });

  const [shipping, setShipping] = useState<ShippingSettings>({
    free_shipping_threshold: 2000,
    standard_shipping_fee: 150,
    estimated_delivery_days: 3,
  });

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [newSocialLink, setNewSocialLink] = useState({
    platform: '',
    url: '',
    icon: '',
  });

  const [emailSettings] = useState<EmailSettings>({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: 'noreply@emart.pk',
    smtp_from_name: 'E-Mart',
    smtp_from_email: 'noreply@emart.pk',
    smtp_encryption: 'TLS',
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSettings = useCallback(async () => {
    try {
      setGeneralLoading(true);
      setPaymentLoading(true);
      setShippingLoading(true);
      const res = await fetch('/api/v1/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.general) setGeneral(data.general);
        if (data.payments) setPayments(data.payments);
        if (data.shipping) setShipping(data.shipping);
      }
    } catch {
      showToast('Failed to load settings', 'error');
    } finally {
      setGeneralLoading(false);
      setPaymentLoading(false);
      setShippingLoading(false);
    }
  }, []);

  const fetchSocialLinks = useCallback(async () => {
    try {
      setSocialLoading(true);
      const res = await fetch('/api/v1/admin/social-links');
      if (res.ok) {
        const data = await res.json();
        setSocialLinks(data.links || data || []);
      }
    } catch {
      showToast('Failed to load social links', 'error');
    } finally {
      setSocialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchSocialLinks();
  }, [fetchSettings, fetchSocialLinks]);

  const saveGeneral = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'general', data: general }),
      });
      if (res.ok) {
        showToast('General settings saved', 'success');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const savePayments = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'payments', data: payments }),
      });
      if (res.ok) {
        showToast('Payment settings saved', 'success');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveShipping = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'shipping', data: shipping }),
      });
      if (res.ok) {
        showToast('Shipping settings saved', 'success');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addSocialLink = async () => {
    if (!newSocialLink.platform || !newSocialLink.url) {
      showToast('Platform and URL are required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/v1/admin/social-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSocialLink),
      });
      if (res.ok) {
        setNewSocialLink({ platform: '', url: '', icon: '' });
        fetchSocialLinks();
        showToast('Social link added', 'success');
      } else {
        showToast('Failed to add social link', 'error');
      }
    } catch {
      showToast('Failed to add social link', 'error');
    }
  };

  const toggleSocialLink = async (id: string, is_active: boolean) => {
    try {
      const res = await fetch(`/api/v1/admin/social-links/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active }),
      });
      if (res.ok) {
        setSocialLinks((prev) =>
          prev.map((l) => (l.id === id ? { ...l, is_active } : l))
        );
      }
    } catch {
      showToast('Failed to update link', 'error');
    }
  };

  const deleteSocialLink = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/social-links/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSocialLinks((prev) => prev.filter((l) => l.id !== id));
        showToast('Social link deleted', 'success');
      }
    } catch {
      showToast('Failed to delete link', 'error');
    }
  };

  const inputClass =
    'w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
  const selectClass =
    'w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-700 focus:border-primary focus:outline-none';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">
          Platform Settings
        </h1>
        <p className="text-sm text-muted-500">
          Configure your marketplace settings
        </p>
      </div>

      <div className="rounded-xl bg-white p-1 shadow-sm">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-muted-600 hover:bg-muted-50'
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary-800">
            General Settings
          </h2>
          <p className="mt-1 text-sm text-muted-500">
            Basic store information and contact details
          </p>
          {generalLoading ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <SkeletonInput />
              <SkeletonInput />
              <SkeletonInput />
              <SkeletonInput />
              <SkeletonInput />
              <SkeletonInput />
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={general.store_name}
                    onChange={(e) =>
                      setGeneral((p) => ({ ...p, store_name: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={general.contact_email}
                    onChange={(e) =>
                      setGeneral((p) => ({
                        ...p,
                        contact_email: e.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={general.contact_phone}
                    onChange={(e) =>
                      setGeneral((p) => ({
                        ...p,
                        contact_phone: e.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={general.logo_url}
                    onChange={(e) =>
                      setGeneral((p) => ({ ...p, logo_url: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                    Store Description
                  </label>
                  <textarea
                    value={general.store_description}
                    onChange={(e) =>
                      setGeneral((p) => ({
                        ...p,
                        store_description: e.target.value,
                      }))
                    }
                    rows={3}
                    className={cn(inputClass, 'resize-none')}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                    Address
                  </label>
                  <input
                    type="text"
                    value={general.address}
                    onChange={(e) =>
                      setGeneral((p) => ({ ...p, address: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={saveGeneral} loading={saving}>
                  <Save className="h-4 w-4" />
                  Save General Settings
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Payment Settings */}
      {activeTab === 'payments' && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary-800">
            Payment Settings
          </h2>
          <p className="mt-1 text-sm text-muted-500">
            Configure payment methods and commission
          </p>
          {paymentLoading ? (
            <div className="mt-6 space-y-4">
              <SkeletonToggle />
              <SkeletonToggle />
              <SkeletonToggle />
              <SkeletonToggle />
              <div className="grid gap-4 sm:grid-cols-2">
                <SkeletonInput />
                <SkeletonInput />
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-4">
                <h3 className="text-sm font-semibold text-secondary-800">
                  Payment Methods
                </h3>
                {[
                  {
                    key: 'stripe_enabled',
                    label: 'Stripe (Credit/Debit Card)',
                    desc: 'Accept international card payments via Stripe',
                  },
                  {
                    key: 'easypaisa_enabled',
                    label: 'Easypaisa',
                    desc: 'Accept payments via Easypaisa mobile wallet',
                  },
                  {
                    key: 'jazzcash_enabled',
                    label: 'JazzCash',
                    desc: 'Accept payments via JazzCash mobile wallet',
                  },
                  {
                    key: 'cod_enabled',
                    label: 'Cash on Delivery',
                    desc: 'Allow customers to pay upon delivery',
                  },
                ].map((method) => (
                  <div
                    key={method.key}
                    className="flex items-center justify-between rounded-lg border border-muted-100 p-4"
                  >
                    <div>
                      <p className="font-medium text-secondary-800">
                        {method.label}
                      </p>
                      <p className="text-sm text-muted-500">{method.desc}</p>
                    </div>
                    <ToggleSwitch
                      checked={
                        payments[method.key as keyof PaymentSettings] as boolean
                      }
                      onChange={(v) =>
                        setPayments((p) => ({
                          ...p,
                          [method.key]: v,
                        }))
                      }
                    />
                  </div>
                ))}
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                      Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={payments.commission_rate}
                      onChange={(e) =>
                        setPayments((p) => ({
                          ...p,
                          commission_rate: Number(e.target.value),
                        }))
                      }
                      className={inputClass}
                    />
                    <p className="mt-1 text-xs text-muted-500">
                      Percentage deducted from each seller sale
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={savePayments} loading={saving}>
                  <Save className="h-4 w-4" />
                  Save Payment Settings
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Shipping Settings */}
      {activeTab === 'shipping' && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary-800">
            Shipping Settings
          </h2>
          <p className="mt-1 text-sm text-muted-500">
            Configure shipping fees and delivery options
          </p>
          {shippingLoading ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              <SkeletonInput />
              <SkeletonInput />
              <SkeletonInput />
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                    Free Shipping Threshold (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={shipping.free_shipping_threshold}
                    onChange={(e) =>
                      setShipping((p) => ({
                        ...p,
                        free_shipping_threshold: Number(e.target.value),
                      }))
                    }
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-muted-500">
                    Orders above this amount get free shipping
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                    Standard Shipping Fee (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={shipping.standard_shipping_fee}
                    onChange={(e) =>
                      setShipping((p) => ({
                        ...p,
                        standard_shipping_fee: Number(e.target.value),
                      }))
                    }
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-muted-500">
                    Default shipping cost per order
                  </p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                    Estimated Delivery (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={shipping.estimated_delivery_days}
                    onChange={(e) =>
                      setShipping((p) => ({
                        ...p,
                        estimated_delivery_days: Number(e.target.value),
                      }))
                    }
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-muted-500">
                    Average delivery time shown to customers
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={saveShipping} loading={saving}>
                  <Save className="h-4 w-4" />
                  Save Shipping Settings
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Social Links */}
      {activeTab === 'social' && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary-800">
            Social Links
          </h2>
          <p className="mt-1 text-sm text-muted-500">
            Manage social media links displayed on your store
          </p>

          <div className="mt-6 rounded-lg border border-muted-200 bg-muted-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-secondary-800">
              Add New Link
            </h3>
            <div className="grid gap-3 sm:grid-cols-4">
              <input
                type="text"
                placeholder="Platform (e.g. Facebook)"
                value={newSocialLink.platform}
                onChange={(e) =>
                  setNewSocialLink((p) => ({
                    ...p,
                    platform: e.target.value,
                  }))
                }
                className={inputClass}
              />
              <input
                type="url"
                placeholder="URL"
                value={newSocialLink.url}
                onChange={(e) =>
                  setNewSocialLink((p) => ({ ...p, url: e.target.value }))
                }
                className={cn(inputClass, 'sm:col-span-2')}
              />
              <Button onClick={addSocialLink}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>

          {socialLoading ? (
            <div className="mt-6 space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : socialLinks.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-muted-300 p-8 text-center">
              <Share2 className="mx-auto h-8 w-8 text-muted-400" />
              <p className="mt-2 text-sm text-muted-500">
                No social links yet. Add one above.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-2">
              {socialLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-lg border border-muted-100 p-4"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-400" />
                    <div>
                      <p className="font-medium text-secondary-800">
                        {link.platform}
                      </p>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        {link.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ToggleSwitch
                      checked={link.is_active}
                      onChange={(v) => toggleSocialLink(link.id, v)}
                    />
                    <button
                      onClick={() => deleteSocialLink(link.id)}
                      className="rounded-lg p-2 text-muted-500 transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary-800">
            Email Settings
          </h2>
          <p className="mt-1 text-sm text-muted-500">
            SMTP configuration for transactional emails
          </p>
          <div className="mt-6 rounded-lg border border-muted-200 bg-muted-50 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-600">
              <AlertCircle className="h-4 w-4" />
              <span>
                Email settings are configured via environment variables and
                cannot be edited here.
              </span>
            </div>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                SMTP Host
              </label>
              <input
                type="text"
                value={emailSettings.smtp_host}
                readOnly
                className={cn(inputClass, 'bg-muted-50 cursor-not-allowed')}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                SMTP Port
              </label>
              <input
                type="text"
                value={emailSettings.smtp_port}
                readOnly
                className={cn(inputClass, 'bg-muted-50 cursor-not-allowed')}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                SMTP Username
              </label>
              <input
                type="text"
                value={emailSettings.smtp_user}
                readOnly
                className={cn(inputClass, 'bg-muted-50 cursor-not-allowed')}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                Encryption
              </label>
              <input
                type="text"
                value={emailSettings.smtp_encryption}
                readOnly
                className={cn(inputClass, 'bg-muted-50 cursor-not-allowed')}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                From Name
              </label>
              <input
                type="text"
                value={emailSettings.smtp_from_name}
                readOnly
                className={cn(inputClass, 'bg-muted-50 cursor-not-allowed')}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">
                From Email
              </label>
              <input
                type="email"
                value={emailSettings.smtp_from_email}
                readOnly
                className={cn(inputClass, 'bg-muted-50 cursor-not-allowed')}
              />
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
