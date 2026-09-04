'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  X,
  Save,
  Building2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  productCount?: number;
}

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  logo_url: '',
  website_url: '',
  is_active: true,
};

export default function AdminStoresPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/brands');
      const json = await res.json();
      if (json.success) setBrands(json.data || []);
      else setError(json.error || 'Failed to load brands');
    } catch {
      setError('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (brand: Brand) => {
    setEditing(brand);
    setForm({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      logo_url: brand.logo_url || '',
      website_url: brand.website_url || '',
      is_active: brand.is_active,
    });
    setShowForm(true);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...(editing ? {} : { name: form.name, slug: form.slug }),
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        logo_url: form.logo_url || null,
        website_url: form.website_url || null,
        is_active: form.is_active,
      };
      const res = await fetch(
        editing ? `/api/v1/admin/brands/${editing.id}` : '/api/v1/admin/brands',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (json.success) {
        setShowForm(false);
        await load();
      } else {
        setError(json.error || 'Failed to save brand');
      }
    } catch {
      setError('Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/v1/admin/brands/${id}`, { method: 'DELETE' });
      await load();
    } catch {
      setError('Failed to delete brand');
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (brand: Brand) => {
    try {
      await fetch(`/api/v1/admin/brands/${brand.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !brand.is_active }),
      });
      await load();
    } catch {
      setError('Failed to update brand');
    }
  };

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Stores & Brands</h1>
          <p className="text-sm text-muted-500">Manage brands and store affiliations</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Brand
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">{error}</div>
      )}

      {showForm && (
        <div className="rounded-xl border border-muted-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-secondary-800">
              {editing ? 'Edit Brand' : 'New Brand'}
            </h2>
            <button onClick={() => setShowForm(false)} className="rounded p-1 text-muted-500 hover:bg-muted-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Brand Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Green Valley"
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
              placeholder="green-valley"
            />
            <Input
              label="Website URL"
              value={form.website_url}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
              placeholder="https://..."
            />
            <Input
              label="Logo URL"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://.../logo.webp"
            />
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-secondary-800">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-muted-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Short description"
            />
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-secondary-800">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-muted-300 text-primary"
            />
            Active
          </label>
          <div className="mt-6 flex gap-3">
            <Button variant="primary" onClick={submit} disabled={saving || !form.name || !form.slug}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editing ? 'Update Brand' : 'Create Brand'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
          <input
            type="text"
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-muted-200 bg-white py-2 pl-10 pr-4 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((brand) => (
              <div key={brand.id} className="rounded-xl border border-muted-100 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-secondary-800">{brand.name}</p>
                      <p className="text-xs text-muted-500">/brands/{brand.slug}</p>
                    </div>
                  </div>
                  <Badge variant={brand.is_active ? 'success' : 'default'} size="sm">
                    {brand.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-600">
                  {brand.description || 'No description'}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-muted-50 pt-3">
                  <span className="text-xs text-muted-500">
                    {brand.productCount ?? 0} products
                  </span>
                  <div className="flex items-center gap-1">
                    {brand.website_url && (
                      <a
                        href={brand.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1.5 text-muted-500 hover:bg-muted-100 hover:text-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => toggleActive(brand)}
                      className="rounded px-2 py-1.5 text-xs font-medium text-muted-500 hover:bg-muted-100 hover:text-primary"
                    >
                      {brand.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => openEdit(brand)}
                      className="rounded p-1.5 text-muted-500 hover:bg-muted-100 hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(brand.id)}
                      disabled={deleting === brand.id}
                      className="rounded p-1.5 text-muted-500 hover:bg-danger-50 hover:text-danger"
                    >
                      {deleting === brand.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-10 text-center text-muted-500">
                No brands found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
