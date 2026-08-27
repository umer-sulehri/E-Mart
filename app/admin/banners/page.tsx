'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ImageIcon, RotateCw } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Banner {
  id: string;
  title: string;
  image_url: string;
  position: string;
  link_url: string;
  is_active: boolean;
  sort_order: number;
}

const POSITIONS = ['hero', 'promo', 'category', 'sidebar'];
const POSITION_LABELS: Record<string, string> = {
  hero: 'Hero Banner',
  promo: 'Promo Banner',
  category: 'Category Banner',
  sidebar: 'Sidebar Banner',
};

function SkeletonRow() {
  return (
    <tr className="border-b border-muted-50">
      <td className="px-6 py-4"><div className="h-20 w-32 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-32 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-16 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-muted-200" /></td>
    </tr>
  );
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [position, setPosition] = useState('hero');
  const [linkUrl, setLinkUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/banners');
      const data = await res.json();
      if (data.success) {
        setBanners(data.data || []);
      } else {
        toast.error(data.error || 'Failed to load banners');
      }
    } catch {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setImageUrl('');
    setPosition('hero');
    setLinkUrl('');
    setIsActive(true);
    setSortOrder(0);
    setFormOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditing(banner);
    setTitle(banner.title);
    setImageUrl(banner.image_url);
    setPosition(banner.position);
    setLinkUrl(banner.link_url);
    setIsActive(banner.is_active);
    setSortOrder(banner.sort_order);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !imageUrl.trim()) {
      toast.error('Title and image are required');
      return;
    }
    setSaving(true);
    try {
      const method = editing ? 'PATCH' : 'POST';
      const url = editing
        ? `/api/v1/admin/banners/${editing.id}`
        : '/api/v1/admin/banners';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          image_url: imageUrl,
          position,
          link_url: linkUrl,
          is_active: isActive,
          sort_order: sortOrder,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editing ? 'Banner updated' : 'Banner created');
        setFormOpen(false);
        fetchBanners();
      } else {
        toast.error(data.error || 'Failed to save banner');
      }
    } catch {
      toast.error('Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (banner: Banner) => {
    setDeleteTarget(banner);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/banners/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Banner deleted');
        fetchBanners();
      } else {
        toast.error(data.error || 'Failed to delete banner');
      }
    } catch {
      toast.error('Failed to delete banner');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Banners</h1>
          <p className="text-sm text-muted-500">Manage website banner placements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchBanners}>
            <RotateCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Banner
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100 bg-muted-50">
                <th className="px-6 py-3 font-medium text-muted-600">Image</th>
                <th className="px-6 py-3 font-medium text-muted-600">Title</th>
                <th className="px-6 py-3 font-medium text-muted-600">Position</th>
                <th className="px-6 py-3 font-medium text-muted-600">Status</th>
                <th className="px-6 py-3 font-medium text-muted-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                : banners.length === 0
                  ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-muted-300" />
                          <p className="text-sm text-muted-500">No banners found</p>
                          <button onClick={openCreate} className="mt-3 text-sm font-medium text-primary hover:text-primary-500">
                            Create your first banner
                          </button>
                        </td>
                      </tr>
                    )
                  : banners.map((banner) => (
                      <tr key={banner.id} className="border-b border-muted-50 transition-colors hover:bg-muted-50/50">
                        <td className="px-6 py-3">
                          <div className="relative h-16 w-28 overflow-hidden rounded-lg bg-muted-100">
                            <Image
                              src={banner.image_url}
                              alt={banner.title}
                              fill
                              className="object-cover"
                              sizes="112px"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-3 font-medium text-secondary-800">{banner.title}</td>
                        <td className="px-6 py-3">
                          <Badge variant="outline">{POSITION_LABELS[banner.position] || banner.position}</Badge>
                        </td>
                        <td className="px-6 py-3">
                          <Badge variant={banner.is_active ? 'success' : 'default'}>
                            {banner.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(banner)}
                              className="rounded-lg p-2 text-muted-500 transition-colors hover:bg-muted-100 hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => confirmDelete(banner)}
                              className="rounded-lg p-2 text-muted-500 transition-colors hover:bg-danger-50 hover:text-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setFormOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-secondary-800">
              {editing ? 'Edit Banner' : 'Add Banner'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-muted-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Summer Sale 2026"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">Image URL</label>
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded-lg border border-muted-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="/images/banner-1.jpg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-secondary-700">Position</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full rounded-lg border border-muted-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>{POSITION_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-secondary-700">Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full rounded-lg border border-muted-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">Link URL</label>
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full rounded-lg border border-muted-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="/products?category=fruits"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-600">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary"
                />
                Active
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave} loading={saving}>
                {editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Banner"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
