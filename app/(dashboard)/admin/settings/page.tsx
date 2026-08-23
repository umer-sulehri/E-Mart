'use client';

import { useState, useEffect, useCallback } from 'react';
import { GearIcon, CheckCircleIcon, PlusIcon, EditIcon, TrashIcon } from '@/components/icons';
import {
  useAdminSocialLinks,
  useCreateSocialLink,
  useUpdateSocialLink,
  useDeleteSocialLink,
} from '@/hooks/useSocialLinks';
import { SocialLink } from '@/lib/types';

const platformOptions = ['facebook', 'instagram', 'whatsapp', 'tiktok', 'youtube', 'x'];

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [platformName, setPlatformName] = useState('E-Mart');
  const [supportEmail, setSupportEmail] = useState('support@emart.com');
  const [defaultCurrency, setDefaultCurrency] = useState('PKR');
  const [taxRate, setTaxRate] = useState('5');
  const [shippingFee, setShippingFee] = useState('200');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('2000');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [autoApproveProducts, setAutoApproveProducts] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const { data: socialLinks = [], isLoading: linksLoading } = useAdminSocialLinks();
  const createLink = useCreateSocialLink();
  const updateLink = useUpdateSocialLink();
  const deleteLink = useDeleteSocialLink();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({ platform: 'facebook', label: '', url: '', icon: '' });
  const [editDraft, setEditDraft] = useState({ platform: '', label: '', url: '', icon: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linksError, setLinksError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/admin/settings');
        if (res.ok) {
          const data = await res.json();
          const s = data.settings;
          if (s.platformName !== undefined) setPlatformName(s.platformName);
          if (s.supportEmail !== undefined) setSupportEmail(s.supportEmail);
          if (s.defaultCurrency !== undefined) setDefaultCurrency(s.defaultCurrency);
          if (s.taxRate !== undefined) setTaxRate(String(s.taxRate));
          if (s.shippingFee !== undefined) setShippingFee(String(s.shippingFee));
          if (s.freeShippingThreshold !== undefined) setFreeShippingThreshold(String(s.freeShippingThreshold));
          if (s.emailNotifications !== undefined) setEmailNotifications(s.emailNotifications);
          if (s.smsNotifications !== undefined) setSmsNotifications(s.smsNotifications);
          if (s.autoApproveProducts !== undefined) setAutoApproveProducts(s.autoApproveProducts);
          if (s.maintenanceMode !== undefined) setMaintenanceMode(s.maintenanceMode);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveSettings = useCallback(async () => {
    setSaving(true);
    try {
      await fetch('/api/v1/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName,
          supportEmail,
          defaultCurrency,
          taxRate: Number(taxRate),
          shippingFee: Number(shippingFee),
          freeShippingThreshold: Number(freeShippingThreshold),
          emailNotifications,
          smsNotifications,
          autoApproveProducts,
          maintenanceMode,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }, [platformName, supportEmail, defaultCurrency, taxRate, shippingFee, freeShippingThreshold, emailNotifications, smsNotifications, autoApproveProducts, maintenanceMode]);

  const handleMove = async (id: string, direction: -1 | 1) => {
    setLinksError('');
    const sorted = [...socialLinks].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((l) => l.id === id);
    const swapIdx = idx + direction;
    if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return;
    try {
      await updateLink.mutateAsync({ id: sorted[idx].id, data: { sortOrder: sorted[swapIdx].sortOrder } });
      await updateLink.mutateAsync({ id: sorted[swapIdx].id, data: { sortOrder: sorted[idx].sortOrder } });
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Failed to reorder link.');
    }
  };

  const handleAddLink = async () => {
    if (!newLink.label || !newLink.url) return;
    try { new URL(newLink.url); } catch { return; }
    setLinksError('');
    try {
      await createLink.mutateAsync({
        platform: newLink.platform,
        label: newLink.label,
        url: newLink.url,
        icon: newLink.icon || `${newLink.platform}Icon`,
        isActive: true,
        sortOrder: socialLinks.length,
      });
      setNewLink({ platform: 'facebook', label: '', url: '', icon: '' });
      setShowAddForm(false);
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Failed to add link.');
    }
  };

  const handleStartEdit = (link: SocialLink) => {
    setEditingId(link.id);
    setEditDraft({ platform: link.platform, label: link.label, url: link.url, icon: link.icon });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editDraft.label || !editDraft.url) return;
    try { new URL(editDraft.url); } catch { return; }
    setLinksError('');
    try {
      await updateLink.mutateAsync({ id, data: editDraft });
      setEditingId(null);
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Failed to save link.');
    }
  };

  const handleDelete = async (id: string) => {
    setLinksError('');
    try {
      await deleteLink.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Failed to delete link.');
    }
  };

  const handleToggleActive = async (link: SocialLink) => {
    setLinksError('');
    try {
      await updateLink.mutateAsync({ id: link.id, data: { isActive: !link.isActive } });
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Failed to update link.');
    }
  };

  const inputStyle = {
    height: '48px',
    borderRadius: '10px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    padding: '0 14px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const btnBase = {
    height: '48px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minWidth: '48px',
    minHeight: '48px',
    padding: '0 16px',
  };

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        position: 'relative',
        background: on ? 'var(--color-primary)' : 'var(--color-border)',
        transition: 'background 0.2s',
      }}
      aria-pressed={on}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: on ? '22px' : '2px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );

  return (
    <div style={{ padding: '24px', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-primary)' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
          borderRadius: '16px',
          padding: '28px 32px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: '#fff',
        }}
      >
        <GearIcon className="w-7 h-7" />
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Platform Settings</h1>
      </div>

      {saved && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--color-success)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontWeight: 600,
          }}
        >
          <CheckCircleIcon className="w-5 h-5" />
          Settings saved successfully
        </div>
      )}

      {/* SECTION 1: Platform Settings */}

      {/* General Settings */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          marginBottom: '20px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '2px solid var(--color-primary)', fontWeight: 700, fontSize: '16px' }}>
          General Settings
        </div>
        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Platform Name</label>
            <input style={inputStyle} value={platformName} onChange={e => setPlatformName(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Support Email</label>
            <input style={inputStyle} type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Default Currency</label>
            <select style={inputStyle} value={defaultCurrency} onChange={e => setDefaultCurrency(e.target.value)}>
              <option value="PKR">PKR - Pakistani Rupee</option>
              <option value="USD">USD - US Dollar</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Tax Rate (%)</label>
            <input style={inputStyle} type="number" min="0" max="100" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Shipping Settings */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          marginBottom: '20px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '2px solid var(--color-primary)', fontWeight: 700, fontSize: '16px' }}>
          Shipping
        </div>
        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Shipping Fee</label>
            <input style={inputStyle} type="number" min="0" value={shippingFee} onChange={e => setShippingFee(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Free Shipping Threshold</label>
            <input style={inputStyle} type="number" min="0" value={freeShippingThreshold} onChange={e => setFreeShippingThreshold(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Features & Notifications */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          marginBottom: '20px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '2px solid var(--color-primary)', fontWeight: 700, fontSize: '16px' }}>
          Features & Notifications
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Email Notifications', on: emailNotifications, toggle: () => setEmailNotifications(p => !p) },
            { label: 'SMS Notifications', on: smsNotifications, toggle: () => setSmsNotifications(p => !p) },
            { label: 'Auto-Approve Products', on: autoApproveProducts, toggle: () => setAutoApproveProducts(p => !p) },
            { label: 'Maintenance Mode', on: maintenanceMode, toggle: () => setMaintenanceMode(p => !p) },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>
              <Toggle on={item.on} onToggle={item.toggle} />
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
          Loading settings...
        </div>
      )}

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          style={{
            ...btnBase,
            background: 'var(--color-primary)',
            color: '#fff',
            opacity: saving ? 0.6 : 1,
          }}
        >
          <CheckCircleIcon className="w-[18px] h-[18px]" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* SECTION 2: Follow Us Links */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
          borderRadius: '16px',
          padding: '28px 32px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fff',
        }}
      >
        <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Follow Us Links</h2>
        <button
          onClick={() => setShowAddForm(p => !p)}
          style={{
            ...btnBase,
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          <PlusIcon className="w-[18px] h-[18px]" />
          {showAddForm ? 'Cancel' : 'Add Link'}
        </button>
      </div>

      {linksError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--color-error)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontWeight: 600,
          }}
          role="alert"
        >
          {linksError}
        </div>
      )}

      {/* Add Link Form */}
      {showAddForm && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            marginBottom: '20px',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '2px solid var(--color-primary)', fontWeight: 700, fontSize: '16px' }}>
            Add New Link
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Platform</label>
              <select
                style={inputStyle}
                value={newLink.platform}
                onChange={e => setNewLink(p => ({ ...p, platform: e.target.value }))}
              >
                {platformOptions.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Label</label>
              <input
                style={inputStyle}
                placeholder="e.g. Follow us on Facebook"
                value={newLink.label}
                onChange={e => setNewLink(p => ({ ...p, label: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>URL</label>
              <input
                style={inputStyle}
                placeholder="https://..."
                value={newLink.url}
                onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Icon Identifier</label>
              <input
                style={inputStyle}
                placeholder="e.g. FacebookIcon"
                value={newLink.icon}
                onChange={e => setNewLink(p => ({ ...p, icon: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleAddLink}
              disabled={!newLink.label || !newLink.url}
              style={{
                ...btnBase,
                background: 'var(--color-primary)',
                color: '#fff',
                opacity: !newLink.label || !newLink.url ? 0.5 : 1,
              }}
            >
              <PlusIcon className="w-[18px] h-[18px]" />
              Add Link
            </button>
          </div>
        </div>
      )}

      {/* Social Links Table */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr
              style={{
                background: 'var(--color-primary-dark)',
                color: 'var(--color-primary)',
              }}
            >
              <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700 }}>Icon</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700 }}>Platform</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700 }}>URL</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700 }}>Active</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700 }}>Order</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {socialLinks.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  {linksLoading ? 'Loading links…' : 'No social links yet. Add one to show it in the footer.'}
                </td>
              </tr>
            ) : (
            socialLinks
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(link => {
                const isEditing = editingId === link.id;
                return (
                  <tr
                    key={link.id}
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    {/* Icon preview */}
                    <td style={{ padding: '12px 16px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'var(--color-surface-alt)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                        }}
                      >
                        {link.icon?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                    </td>

                    {/* Platform */}
                    <td style={{ padding: '12px 16px' }}>
                      {isEditing ? (
                        <select
                          style={{ ...inputStyle, height: '38px' }}
                          value={editDraft.platform}
                          onChange={e => setEditDraft(p => ({ ...p, platform: e.target.value }))}
                        >
                          {platformOptions.map(p => (
                            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontWeight: 600 }}>{link.label}</span>
                      )}
                    </td>

                    {/* URL */}
                    <td style={{ padding: '12px 16px' }}>
                      {isEditing ? (
                        <input
                          style={{ ...inputStyle, height: '38px' }}
                          value={editDraft.url}
                          onChange={e => setEditDraft(p => ({ ...p, url: e.target.value }))}
                        />
                      ) : (
                        <span
                          style={{ color: 'var(--color-text-secondary)', maxWidth: '220px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={link.url}
                        >
                          {link.url}
                        </span>
                      )}
                    </td>

                    {/* Active Toggle */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Toggle on={link.isActive} onToggle={() => handleToggleActive(link)} />
                      </div>
                    </td>

                    {/* Sort Order + Arrows */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <button
                          onClick={() => handleMove(link.id, -1)}
                          disabled={updateLink.isPending}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            color: 'var(--color-text-primary)',
                          }}
                          aria-label="Move up"
                        >
                          ▲
                        </button>
                        <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 600 }}>{link.sortOrder}</span>
                        <button
                          onClick={() => handleMove(link.id, 1)}
                          disabled={updateLink.isPending}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            color: 'var(--color-text-primary)',
                          }}
                          aria-label="Move down"
                        >
                          ▼
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(link.id)}
                              style={{
                                ...btnBase,
                                height: '40px',
                                minHeight: '40px',
                                padding: '0 14px',
                                background: 'var(--color-success)',
                                color: '#fff',
                                fontSize: '13px',
                              }}
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              style={{
                                ...btnBase,
                                height: '40px',
                                minHeight: '40px',
                                padding: '0 14px',
                                background: 'var(--color-border)',
                                color: 'var(--color-text-primary)',
                                fontSize: '13px',
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(link)}
                              style={{
                                ...btnBase,
                                height: '40px',
                                minHeight: '40px',
                                padding: '0 14px',
                                background: 'var(--color-primary)',
                                color: '#fff',
                                fontSize: '13px',
                              }}
                              aria-label={`Edit ${link.label}`}
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(link.id)}
                              style={{
                                ...btnBase,
                                height: '40px',
                                minHeight: '40px',
                                padding: '0 14px',
                                background: 'var(--color-error)',
                                color: '#fff',
                                fontSize: '13px',
                              }}
                              aria-label={`Delete ${link.label}`}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                       </div>
                     </td>
                   </tr>
                 );
               })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Confirm Delete</h3>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Are you sure you want to delete this social link? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  ...btnBase,
                  background: 'var(--color-surface-alt)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                style={{
                  ...btnBase,
                  background: 'var(--color-error)',
                  color: '#fff',
                }}
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
