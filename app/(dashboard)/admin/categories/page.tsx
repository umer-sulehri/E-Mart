'use client';

import { useState } from 'react';
import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useAdmin';
import { Category } from '@/lib/types';
import { SearchIcon, PlusIcon, EditIcon, TrashIcon } from '@/components/icons';

export default function AdminCategoriesPage() {
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useAdminCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const filtered = search
    ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase()))
    : categories;

  const handleCreate = () => {
    if (!newName || !newSlug || !newIcon) return;
    createCategory.mutate({ name: newName, slug: newSlug, icon: newIcon }, {
      onSuccess: () => { setNewName(''); setNewSlug(''); setNewIcon(''); },
    });
  };

  const handleUpdate = () => {
    if (!editCat) return;
    updateCategory.mutate({ id: editCat.id, body: { name: editName, slug: editSlug } }, {
      onSuccess: () => setEditCat(null),
    });
  };

  const handleDelete = (id: string) => {
    deleteCategory.mutate(id, { onSuccess: () => setDeleteConfirm(null) });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Category Management</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{filtered.length} categories</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: 'var(--color-text-secondary)' }} />
        <input
          type="search"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-[48px] pl-11 pr-4 rounded-[10px] text-base focus:outline-none focus:ring-2"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          aria-label="Search categories"
        />
      </div>

      {/* Add Category Form */}
      <div className="rounded-[16px] p-5" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Add Category</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} className="flex-1 h-[48px] px-4 rounded-[10px] text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          <input type="text" placeholder="Slug" value={newSlug} onChange={e => setNewSlug(e.target.value)} className="flex-1 h-[48px] px-4 rounded-[10px] text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          <input type="text" placeholder="Icon" value={newIcon} onChange={e => setNewIcon(e.target.value)} className="w-24 h-[48px] px-4 rounded-[10px] text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          <button onClick={handleCreate} disabled={createCategory.isPending} className="h-[48px] px-5 rounded-[12px] text-sm font-semibold text-white flex items-center gap-2 transition-all" style={{ background: 'var(--color-primary)' }}>
            <PlusIcon className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="rounded-[16px] overflow-hidden" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full" style={{ background: 'var(--color-surface-alt)' }} />
                <div className="flex-1 space-y-2"><div className="h-4 rounded w-1/3" style={{ background: 'var(--color-surface-alt)' }} /></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Icon', 'Name', 'Slug', 'Children', 'Actions'].map(h => (
                    <th key={h} className="text-left p-4 font-semibold text-sm" style={{ background: 'var(--color-primary-dark)', color: 'var(--color-primary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>No categories found.</td></tr>
                ) : filtered.map(cat => (
                  <tr key={cat.id} className="transition-colors hover:bg-white/50" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="p-4 text-xl">{cat.icon}</td>
                    <td className="p-4 font-medium" style={{ color: 'var(--color-text-primary)' }}>{cat.name}</td>
                    <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{cat.slug}</td>
                    <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{cat.children?.length ?? 0}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => { setEditCat(cat); setEditName(cat.name); setEditSlug(cat.slug); }}
                          className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors"
                          aria-label={`Edit ${cat.name}`}
                        >
                          <EditIcon className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(cat.id)}
                          className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-xs font-semibold text-error hover:bg-error/10 transition-colors"
                          aria-label={`Delete ${cat.name}`}
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setEditCat(null)}>
          <div className="w-full max-w-md rounded-[16px] p-6" style={{ background: 'var(--color-bg)' }} onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Edit Category</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full h-[48px] px-4 rounded-[10px] text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Slug</label>
                <input type="text" value={editSlug} onChange={e => setEditSlug(e.target.value)} className="w-full h-[48px] px-4 rounded-[10px] text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditCat(null)} className="flex-1 h-[48px] rounded-[12px] text-sm font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancel</button>
              <button onClick={handleUpdate} disabled={updateCategory.isPending} className="flex-1 h-[48px] rounded-[12px] text-sm font-semibold text-white" style={{ background: 'var(--color-primary)' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-[16px] p-6 text-center" style={{ background: 'var(--color-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(182,92,75,0.15)' }}>
              <TrashIcon className="w-8 h-8" style={{ color: 'var(--color-error)' }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Delete Category?</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-[48px] rounded-[12px] text-sm font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 h-[48px] rounded-[12px] text-sm font-semibold text-white" style={{ background: 'var(--color-error)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
