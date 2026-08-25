'use client';

import { useState } from 'react';
import {
  Grid,
  Plus,
  Edit3,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  X,
  Upload,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/lib/constants';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  productCount: number;
  subcategoryCount: number;
  isActive: boolean;
  thumbnail: string;
}

const categoriesData: CategoryItem[] = CATEGORIES.map((cat) => ({
  id: cat.id,
  name: cat.name,
  slug: cat.slug,
  icon: cat.icon,
  productCount: Math.floor(Math.random() * 300) + 20,
  subcategoryCount: 'subcategories' in cat ? (cat as any).subcategories?.length ?? 0 : Math.floor(Math.random() * 6),
  isActive: true,
  thumbnail: cat.thumbnail,
}));

export default function AdminCategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    parentId: '',
    sortOrder: '0',
    isActive: true,
  });

  const totalProducts = categoriesData.reduce((sum, c) => sum + c.productCount, 0);
  const activeCategories = categoriesData.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Categories Management</h1>
          <p className="text-sm text-muted-500">Organize your product catalog</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Grid className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{categoriesData.length}</p>
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
              <p className="text-2xl font-bold text-secondary-800">{activeCategories}</p>
              <p className="text-xs text-muted-500">Active</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
              <Grid className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{totalProducts.toLocaleString()}</p>
              <p className="text-xs text-muted-500">Total Products</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Category Form */}
      {showForm && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-800">Add New Category</h2>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1 text-muted-500 hover:bg-muted-100"
            >
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
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Parent Category</label>
              <select
                value={newCategory.parentId}
                onChange={(e) => setNewCategory({ ...newCategory, parentId: e.target.value })}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-700 focus:border-primary focus:outline-none"
              >
                <option value="">None (Top Level)</option>
                {categoriesData.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Sort Order</label>
              <input
                type="number"
                value={newCategory.sortOrder}
                onChange={(e) => setNewCategory({ ...newCategory, sortOrder: e.target.value })}
                className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-secondary-800">Image</label>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-muted-300 px-4 py-2.5 text-sm text-muted-500 transition-colors hover:border-primary hover:text-primary">
                  <Upload className="h-4 w-4" />
                  Upload
                  <input type="file" className="hidden" accept="image/*" />
                </label>
              </div>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newCategory.isActive}
                  onChange={(e) => setNewCategory({ ...newCategory, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-secondary-800">Active</span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button>Add Category</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categoriesData.map((cat) => (
          <div
            key={cat.id}
            className="group relative rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50">
                  <Image
                    src={cat.thumbnail}
                    alt={cat.name}
                    width={80}
                    height={80}
                    className="h-10 w-10 rounded object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-secondary-800">{cat.name}</h3>
                  <p className="text-xs text-muted-500">{cat.productCount} products</p>
                </div>
              </div>
              <Badge variant={cat.isActive ? 'success' : 'default'} size="sm">
                {cat.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-500">
              <span>{cat.subcategoryCount} subcategories</span>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                  className="rounded p-1 text-muted-500 hover:bg-muted-100 hover:text-primary"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button className="rounded p-1 text-muted-500 hover:bg-danger-50 hover:text-danger">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drag hint */}
      <p className="text-center text-sm text-muted-400">
        Drag and drop categories to reorder (coming soon)
      </p>
    </div>
  );
}
