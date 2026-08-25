'use client';

import { useState } from 'react';
import {
  Settings,
  CreditCard,
  Bell,
  Shield,
  Save,
  Globe,
  Mail,
  Phone,
  DollarSign,
  Smartphone,
  Lock,
  Clock,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type Tab = 'general' | 'payments' | 'notifications' | 'security';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState({
    siteName: 'E-Mart',
    tagline: 'Fresh groceries delivered to your doorstep',
    contactEmail: 'support@emart.pk',
    phone: '+92-300-1234567',
    currency: 'PKR',
    language: 'en',
    timezone: 'Asia/Karachi',
    easypaisa: true,
    jazzcash: true,
    stripe: true,
    cod: true,
    commissionRate: '5',
    minPayout: '5000',
    emailOrderPlaced: true,
    emailOrderShipped: true,
    emailOrderDelivered: true,
    emailNewSeller: true,
    emailLowStock: true,
    emailNewReview: true,
    smsOrderPlaced: true,
    smsOrderShipped: true,
    smsOrderDelivered: false,
    twoFactorAuth: false,
    sessionTimeout: '30',
    ipWhitelist: '',
  });

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">Platform Settings</h1>
        <p className="text-sm text-muted-500">Configure your marketplace settings</p>
      </div>

      {/* Tabs */}
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

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary-800">General Settings</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => updateSetting('siteName', e.target.value)}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => updateSetting('tagline', e.target.value)}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => updateSetting('contactEmail', e.target.value)}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Phone</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => updateSetting('phone', e.target.value)}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => updateSetting('currency', e.target.value)}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-700 focus:border-primary focus:outline-none"
              >
                <option value="PKR">PKR - Pakistani Rupee</option>
                <option value="USD">USD - US Dollar</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Language</label>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-700 focus:border-primary focus:outline-none"
              >
                <option value="en">English</option>
                <option value="ur">Urdu</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => updateSetting('timezone', e.target.value)}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-700 focus:border-primary focus:outline-none"
              >
                <option value="Asia/Karachi">Asia/Karachi (PKT, UTC+5)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary-800">Payment Settings</h2>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="mb-4 text-sm font-semibold text-secondary-800">Payment Methods</h3>
              <div className="space-y-4">
                {[
                  { key: 'easypaisa', label: 'Easypaisa', desc: 'Accept payments via Easypaisa mobile wallet' },
                  { key: 'jazzcash', label: 'JazzCash', desc: 'Accept payments via JazzCash mobile wallet' },
                  { key: 'stripe', label: 'Stripe (Credit/Debit Card)', desc: 'Accept international card payments' },
                  { key: 'cod', label: 'Cash on Delivery', desc: 'Allow customers to pay upon delivery' },
                ].map((method) => (
                  <div key={method.key} className="flex items-center justify-between rounded-lg border border-muted-100 p-4">
                    <div>
                      <p className="font-medium text-secondary-800">{method.label}</p>
                      <p className="text-sm text-muted-500">{method.desc}</p>
                    </div>
                    <ToggleSwitch
                      checked={settings[method.key as keyof typeof settings] as boolean}
                      onChange={(v) => updateSetting(method.key, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-800">Commission Rate (%)</label>
                <input
                  type="number"
                  value={settings.commissionRate}
                  onChange={(e) => updateSetting('commissionRate', e.target.value)}
                  className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-800">Minimum Payout (PKR)</label>
                <input
                  type="number"
                  value={settings.minPayout}
                  onChange={(e) => updateSetting('minPayout', e.target.value)}
                  className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary-800">Notification Settings</h2>
          <div className="mt-6 space-y-8">
            <div>
              <h3 className="mb-4 text-sm font-semibold text-secondary-800">Email Notifications</h3>
              <div className="space-y-3">
                {[
                  { key: 'emailOrderPlaced', label: 'Order Placed', desc: 'When a new order is placed' },
                  { key: 'emailOrderShipped', label: 'Order Shipped', desc: 'When an order is shipped' },
                  { key: 'emailOrderDelivered', label: 'Order Delivered', desc: 'When an order is delivered' },
                  { key: 'emailNewSeller', label: 'New Seller Registration', desc: 'When a new seller signs up' },
                  { key: 'emailLowStock', label: 'Low Stock Alert', desc: 'When a product stock is low' },
                  { key: 'emailNewReview', label: 'New Review', desc: 'When a new review is submitted' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg border border-muted-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-secondary-800">{item.label}</p>
                      <p className="text-xs text-muted-500">{item.desc}</p>
                    </div>
                    <ToggleSwitch
                      checked={settings[item.key as keyof typeof settings] as boolean}
                      onChange={(v) => updateSetting(item.key, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold text-secondary-800">SMS Notifications</h3>
              <div className="space-y-3">
                {[
                  { key: 'smsOrderPlaced', label: 'Order Confirmation', desc: 'SMS when order is placed' },
                  { key: 'smsOrderShipped', label: 'Shipping Update', desc: 'SMS when order is shipped' },
                  { key: 'smsOrderDelivered', label: 'Delivery Confirmation', desc: 'SMS when order is delivered' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg border border-muted-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-secondary-800">{item.label}</p>
                      <p className="text-xs text-muted-500">{item.desc}</p>
                    </div>
                    <ToggleSwitch
                      checked={settings[item.key as keyof typeof settings] as boolean}
                      onChange={(v) => updateSetting(item.key, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary-800">Security Settings</h2>
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between rounded-lg border border-muted-100 p-4">
              <div>
                <p className="font-medium text-secondary-800">Two-Factor Authentication</p>
                <p className="text-sm text-muted-500">Add an extra layer of security to admin accounts</p>
              </div>
              <ToggleSwitch
                checked={settings.twoFactorAuth}
                onChange={(v) => updateSetting('twoFactorAuth', v)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Session Timeout (minutes)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting('sessionTimeout', e.target.value)}
                className="w-full max-w-xs rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-xs text-muted-500">Admin sessions will expire after this duration of inactivity</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">IP Whitelist</label>
              <textarea
                value={settings.ipWhitelist}
                onChange={(e) => updateSetting('ipWhitelist', e.target.value)}
                placeholder="Enter IP addresses, one per line"
                rows={4}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-xs text-muted-500">Leave empty to allow all IPs. Add one IP per line.</p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button>
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
