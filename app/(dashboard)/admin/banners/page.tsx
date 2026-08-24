'use client';

import { useState } from 'react';
import { useAdminBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from '@/hooks/useBanners';
import { Banner, BannerSlot } from '@/lib/types';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/icons';

const SLOTS: BannerSlot[] = ['hero', 'promo-small', 'promo-wide'];

const inputStyle = {
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
} as const;

export default function AdminBannersPage() {
  const { data: banners = [], isLoading } = useAdminBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();

  const [form, setForm] = useState({
    slot: 'hero' as BannerSlot,
    title: '',
    subtitle: '',
    description: '',
    imageUrl: '',
    badgeText: '',
    ctaLabel: 'Shop Now',
    ctaHref: '/products',
    sortOrder: 0,
    isActive: true,
  });
  const [edit, setEdit] = useState<Banner | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreate = () => {
    if (!form.title) return;
    createBanner.mutate(
      {
        ...form,
        subtitle: form.subtitle || undefined,
        description: form.description || undefined,
        imageUrl: form.imageUrl || undefined,
        badgeText: form.badgeText || undefined,
      },
      { onSuccess: () => setForm({ slot: 'hero', title: '', subtitle: '', description: '', imageUrl: '', badgeText: '', ctaLabel: 'Shop Now', ctaHref: '/products', sortOrder: 0, isActive: true }) },
    );
  };

  const handleUpdate = () => {
    if (!edit) return;
    updateBanner.mutate({
      id: edit.id,
      slot: edit.slot,
      title: edit.title,
      subtitle: edit.subtitle ?? undefined,
      description: edit.description ?? undefined,
      imageUrl: edit.imageUrl ?? undefined,
      badgeText: edit.badgeText ?? undefined,
      ctaLabel: edit.ctaLabel ?? undefined,
      ctaHref: edit.ctaHref ?? undefined,
      sortOrder: edit.sortOrder,
      isActive: edit.isActive,
    }, { onSuccess: () => setEdit(null) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Banner Management</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{banners.length} banners — control the storefront hero and promo blocks</p>
      </div>

      {/* Add banner */}
      <div className="rounded-[16px] p-5" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Add Banner</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          <select value={form.slot} onChange={(e) => setForm({ ...form, slot: e.target.value as BannerSlot })} className="h-[48px] px-4 rounded-[10px] text-sm" style={inputStyle} aria-label="Banner slot">
            {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="text" placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-[48px] px-4 rounded-[10px] text-sm" style={inputStyle} />
          <input type="text" placeholder="Subtitle (e.g. 100% natural)" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="h-[48px] px-4 rounded-[10px] text-sm" style={inputStyle} />
          <input type="text" placeholder="Image URL (/images/...)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="h-[48px] px-4 rounded-[10px] text-sm" style={inputStyle} />
          <input type="text" placeholder="Badge text (e.g. 20% off)" value={form.badgeText} onChange={(e) => setForm({ ...form, badgeText: e.target.value })} className="h-[48px] px-4 rounded-[10px] text-sm" style={inputStyle} />
          <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-[48px] px-4 rounded-[10px] text-sm" style={inputStyle} />
          <input type="text" placeholder="CTA label" value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} className="h-[48px] px-4 rounded-[10px] text-sm" style={inputStyle} />
          <input type="text" placeholder="CTA link (/products)" value={form.ctaHref} onChange={(e) => setForm({ ...form, ctaHref: e.target.value })} className="h-[48px] px-4 rounded-[10px] text-sm" style={inputStyle} />
          <input type="number" placeholder="Sort order" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="h-[48px] px-4 rounded-[10px] text-sm" style={inputStyle} />
        </div>
        <button onClick={handleCreate} disabled={createBanner.isPending} className="h-[48px] px-5 rounded-[12px] text-sm font-semibold text-white flex items-center gap-2 transition-all" style={{ background: 'var(--color-primary)' }}>
          <PlusIcon className="w-4 h-4" /> Add Banner
        </button>
      </div>

      {/* Table */}
      <div className="rounded-[16px] overflow-hidden" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 rounded animate-pulse" style={{ background: 'var(--color-surface-alt)' }} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Slot', 'Title', 'Badge', 'CTA', 'Order', 'Active', 'Actions'].map((h) => (
                    <th key={h} className="text-left p-4 font-semibold text-sm" style={{ background: 'var(--color-primary-dark)', color: 'var(--color-primary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {banners.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>No banners yet. Run the banners migration or add one above.</td></tr>
                ) : banners.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-white/50" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--color-secondary)', color: 'var(--color-primary-dark)' }}>{b.slot}</span></td>
                    <td className="p-4 font-medium" style={{ color: 'var(--color-text-primary)' }}>{b.title}</td>
                    <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{b.badgeText ?? '-'}</td>
                    <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{b.ctaLabel ? `${b.ctaLabel} → ${b.ctaHref}` : '-'}</td>
                    <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{b.sortOrder}</td>
                    <td className="p-4">
                      <button
                        onClick={() => updateBanner.mutate({ id: b.id, isActive: !b.isActive })}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{
                          background: b.isActive ? 'rgba(25,135,84,0.15)' : 'var(--color-surface-alt)',
                          color: b.isActive ? 'var(--color-success)' : 'var(--color-text-secondary)',
                        }}
                      >
                        {b.isActive ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button onClick={() => setEdit(b)} className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors" aria-label={`Edit ${b.title}`}>
                          <EditIcon className="w-4 h-4" />
                          Edit
                        </button>
                        <button onClick={() => setDeleteConfirm(b.id)} className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-xs font-semibold text-error hover:bg-error/10 transition-colors" aria-label={`Delete ${b.title}`}>
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

      {/* Edit modal */}
      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setEdit(null)}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-[16px] p-6" style={{ background: 'var(--color-bg)' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Edit Banner</h2>
            <div className="space-y-3">
              {[
                ['Title', 'title'],
                ['Subtitle', 'subtitle'],
                ['Description', 'description'],
                ['Image URL', 'imageUrl'],
                ['Badge text', 'badgeText'],
                ['CTA label', 'ctaLabel'],
                ['CTA link', 'ctaHref'],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{label}</label>
                  <input
                    type="text"
                    value={(edit as unknown as Record<string, string | undefined>)[key] ?? ''}
                    onChange={(e) => setEdit({ ...edit, [key]: e.target.value })}
                    className="w-full h-[44px] px-4 rounded-[10px] text-sm"
                    style={inputStyle}
                  />
                </div>
              ))}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Slot</label>
                  <select value={edit.slot} onChange={(e) => setEdit({ ...edit, slot: e.target.value as BannerSlot })} className="w-full h-[44px] px-4 rounded-[10px] text-sm" style={inputStyle}>
                    {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Order</label>
                  <input type="number" value={edit.sortOrder} onChange={(e) => setEdit({ ...edit, sortOrder: Number(e.target.value) })} className="w-full h-[44px] px-4 rounded-[10px] text-sm" style={inputStyle} />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={edit.isActive} onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })} />
                    Active
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEdit(null)} className="flex-1 h-[48px] rounded-[12px] text-sm font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancel</button>
              <button onClick={handleUpdate} disabled={updateBanner.isPending} className="flex-1 h-[48px] rounded-[12px] text-sm font-semibold text-white" style={{ background: 'var(--color-primary)' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-[16px] p-6 text-center" style={{ background: 'var(--color-bg)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Delete Banner?</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-[48px] rounded-[12px] text-sm font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancel</button>
              <button
                onClick={() => deleteBanner.mutate(deleteConfirm, { onSuccess: () => setDeleteConfirm(null) })}
                className="flex-1 h-[48px] rounded-[12px] text-sm font-semibold text-white"
                style={{ background: 'var(--color-error)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
