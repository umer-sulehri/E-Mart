'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Link2,
  X,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  is_active: boolean;
  created_at: string;
}

const emptyForm = { platform: '', url: '', is_active: true };

const platformIcons: Record<string, typeof Link2> = {
  facebook: Facebook,
  twitter: Twitter,
  x: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
};

export default function AdminSocialLinksPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/social-links');
      const json = await res.json();
      if (json.success) setLinks(json.data || []);
      else setError(json.error || 'Failed to load social links');
    } catch {
      setError('Failed to load social links');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (link: SocialLink) => {
    setEditingId(link.id);
    setForm({ platform: link.platform, url: link.url, is_active: link.is_active });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.platform.trim() || !form.url.trim()) {
      toast.error('Platform and URL are required');
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!editingId;
      const res = await fetch(
        isEdit ? `/api/v1/admin/social-links/${editingId}` : '/api/v1/admin/social-links',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform: form.platform.trim().toLowerCase(),
            url: form.url.trim(),
            is_active: form.is_active,
          }),
        }
      );
      const json = await res.json();
      if (json.success) {
        toast.success(isEdit ? 'Social link updated' : 'Social link added');
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        await load();
      } else {
        toast.error(json.error || 'Failed to save social link');
      }
    } catch {
      toast.error('Failed to save social link');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (link: SocialLink) => {
    setBusyId(link.id);
    try {
      const res = await fetch(`/api/v1/admin/social-links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !link.is_active }),
      });
      const json = await res.json();
      if (json.success) {
        setLinks((prev) =>
          prev.map((l) =>
            l.id === link.id ? { ...l, is_active: !l.is_active } : l
          )
        );
      } else {
        toast.error(json.error || 'Update failed');
      }
    } catch {
      toast.error('Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/v1/admin/social-links/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Social link deleted');
        setLinks((prev) => prev.filter((l) => l.id !== id));
      } else {
        toast.error(json.error || 'Failed to delete social link');
      }
    } catch {
      toast.error('Failed to delete social link');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">Social Links</h1>
        <p className="text-sm text-muted-500">Manage the social media links shown across the site</p>
      </div>

      {error && (
        <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-500">{links.length} link(s) configured</p>
        <Button size="sm" onClick={startAdd}>
          <Plus className="h-4 w-4" />
          Add Link
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-primary-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-secondary-800">
              {editingId ? 'Edit Social Link' : 'Add Social Link'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-lg p-1 hover:bg-muted-100"
            >
              <X className="h-5 w-5 text-muted-500" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Platform</label>
              <input
                value={form.platform}
                onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                placeholder="facebook, instagram, twitter, youtube..."
                className="w-full rounded-lg border border-muted-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">URL</label>
              <input
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-lg border border-muted-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-secondary-800">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary"
                />
                Active
              </label>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editingId ? 'Update Link' : 'Save Link'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : links.length === 0 ? (
          <div className="py-12 text-center text-muted-500">
            <Link2 className="mx-auto mb-2 h-8 w-8" />
            No social links yet
          </div>
        ) : (
          <ul className="divide-y divide-muted-100">
            {links.map((link) => {
              const Icon = platformIcons[link.platform?.toLowerCase()] || Link2;
              return (
                <li
                  key={link.id}
                  className={cn(
                    'flex items-center gap-4 px-6 py-4',
                    !link.is_active && 'opacity-60'
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium capitalize text-secondary-800">{link.platform}</p>
                    <p className="truncate text-xs text-muted-500">{link.url}</p>
                  </div>
                  <Badge variant={link.is_active ? 'success' : 'default'} size="sm">
                    {link.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <button
                    onClick={() => toggleActive(link)}
                    disabled={busyId === link.id}
                    className="rounded-lg bg-muted-100 px-3 py-1.5 text-xs font-medium text-secondary-700 hover:bg-muted-200 disabled:opacity-60"
                  >
                    {link.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => startEdit(link)}
                    disabled={busyId === link.id}
                    className="rounded-lg p-1.5 text-muted-500 hover:bg-muted-100 hover:text-secondary-800 disabled:opacity-60"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    disabled={busyId === link.id}
                    className="rounded-lg p-1.5 text-danger hover:bg-danger-50 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
