'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import {
  Grid,
  Plus,
  Edit3,
  Trash2,
  Eye,
  X,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-lg bg-muted-200" />
          <div className="space-y-1">
            <div className="h-4 w-28 animate-pulse rounded bg-muted-200" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted-200" />
          </div>
        </div>
        <div className="h-6 w-14 animate-pulse rounded bg-muted-200" />
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    imageUrl: '',
    displayOrder: 0,
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      } else {
        toast.error(data.error || 'Failed to load categories');
      }
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Category created');
        setShowForm(false);
        setNewCategory({ name: '', description: '', imageUrl: '', displayOrder: 0 });
        fetchCategories();
      } else {
        toast.error(data.error || 'Failed to create category');
      }
    } catch {
      toast.error('Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !newCategory.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/categories/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Category updated');
        setEditingId(null);
        setShowForm(false);
        setNewCategory({ name: '', description: '', imageUrl: '', displayOrder: 0 });
        fetchCategories();
      } else {
        toast.error(data.error || 'Failed to update category');
      }
    } catch {
      toast.error('Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`/api/v1/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Category deleted');
        fetchCategories();
      } else {
        toast.error(data.error || 'Failed to delete category');
      }
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setNewCategory({
      name: cat.name,
      description: cat.description || '',
      imageUrl: cat.image_url || '',
      displayOrder: cat.display_order || 0,
    });
    setShowForm(true);
  };

  const totalProducts = categories.reduce((sum: number, c: any) => sum + (c.product_count || 0), 0);
  const activeCategories = categories.filter((c: any) => c.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Categories Management</h1>
          <p className="text-sm text-muted-500">Organize your product catalog</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setNewCategory({ name: '', description: '', imageUrl: '', displayOrder: 0 }); }}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Grid className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{loading ? '...' : categories.length}</p>
              <p className="text-xs text-muted-500">Total Categories</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 text-success-600">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{loading ? '...' : activeCategories}</p>
              <p className="text-xs text-muted-500">Active</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{loading ? '...' : totalProducts.toLocaleString()}</p>
              <p className="text-xs text-muted-500">Total Products</p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-800">{editingId ? 'Edit Category' : 'Add New Category'}</h2>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-lg p-1 text-muted-500 hover:bg-muted-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Name</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Category name"
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Description</label>
              <input
                type="text"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Short description"
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Image URL</label>
              <input
                type="text"
                value={newCategory.imageUrl}
                onChange={(e) => setNewCategory({ ...newCategory, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Display Order</label>
              <input
                type="number"
                value={newCategory.displayOrder}
                onChange={(e) => setNewCategory({ ...newCategory, displayOrder: Number(e.target.value) })}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={editingId ? handleUpdate : handleCreate} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Category' : 'Add Category'}
            </Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : categories.map((cat: any) => (
              <div key={cat.id} className="group relative rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50">
                      {cat.image_url ? (
                        <Image src={cat.image_url} alt={cat.name} width={40} height={40} className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <Grid className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-secondary-800">{cat.name}</h3>
                      <p className="text-xs text-muted-500">{cat.subcategories?.length ?? 0} subcategories</p>
                    </div>
                  </div>
                  <Badge variant={cat.is_active ? 'success' : 'default'} size="sm">
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-500">
                  <span>{cat.description || 'No description'}</span>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => startEdit(cat)} className="rounded p-1 text-muted-500 hover:bg-muted-100 hover:text-primary">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="rounded p-1 text-muted-500 hover:bg-danger-50 hover:text-danger">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
