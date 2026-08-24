'use client';

import { useState } from 'react';
import { useAdminBlogPosts, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost } from '@/hooks/useBlogPosts';
import { BlogPost } from '@/lib/types';
import { PlusIcon, EditIcon, TrashIcon } from '@/components/icons';

const inputStyle = {
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
} as const;

const emptyForm = {
  slug: '',
  title: '',
  excerpt: '',
  content: '',
  author: 'E-Mart Team',
  category: 'general',
  coverImage: '/images/post-thumb-1.jpg',
  readTime: 4,
};

export default function AdminBlogPage() {
  const { data: posts = [], isLoading } = useAdminBlogPosts();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();

  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<BlogPost | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreate = () => {
    if (!form.slug || !form.title || !form.excerpt || !form.content) return;
    createPost.mutate(form, {
      onSuccess: () => {
        setForm(emptyForm);
        setShowForm(false);
      },
    });
  };

  const handleUpdate = () => {
    if (!edit) return;
    updatePost.mutate(
      {
        id: edit.id,
        slug: edit.slug,
        title: edit.title,
        excerpt: edit.excerpt,
        content: edit.content,
        author: edit.author,
        category: edit.category,
        tags: edit.tags,
        coverImage: edit.coverImage,
        readTime: edit.readTime,
      },
      { onSuccess: () => setEdit(null) },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Blog Management</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{posts.length} posts</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="h-[44px] px-5 rounded-[12px] text-sm font-semibold text-white flex items-center gap-2" style={{ background: 'var(--color-primary)' }}>
          <PlusIcon className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-[16px] p-5" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Create Post</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input type="text" placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })} className="h-[48px] px-4 rounded-[10px] text-sm" style={inputStyle} />
            <input type="text" placeholder="Slug (auto)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="h-[48px] px-4 rounded-[10px] text-sm" style={inputStyle} />
            <input type="text" placeholder="Author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="h-[48px] px-4 rounded-[10px] text-sm" style={inputStyle} />
            <input type="text" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-[48px] px-4 rounded-[10px] text-sm" style={inputStyle} />
            <input type="text" placeholder="Cover image (/images/...)" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} className="h-[48px] px-4 rounded-[10px] text-sm" style={inputStyle} />
            <input type="number" min={1} placeholder="Read time (min)" value={form.readTime} onChange={(e) => setForm({ ...form, readTime: Number(e.target.value) || 1 })} className="h-[48px] px-4 rounded-[10px] text-sm" style={inputStyle} />
          </div>
          <textarea placeholder="Excerpt *" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} className="w-full px-4 py-3 mb-3 rounded-[10px] text-sm" style={inputStyle} />
          <textarea placeholder="Content * (markdown supported: ## heading, - list, **bold**)" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} className="w-full px-4 py-3 mb-3 rounded-[10px] text-sm font-mono" style={inputStyle} />
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={createPost.isPending} className="h-[48px] px-5 rounded-[12px] text-sm font-semibold text-white" style={{ background: 'var(--color-primary)' }}>Publish</button>
            <button onClick={() => setShowForm(false)} className="h-[48px] px-5 rounded-[12px] text-sm font-semibold" style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Posts table */}
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
                  {['Title', 'Category', 'Author', 'Published', 'Actions'].map((h) => (
                    <th key={h} className="text-left p-4 font-semibold text-sm" style={{ background: 'var(--color-primary-dark)', color: 'var(--color-primary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>No blog posts yet. Run the blog migration or create one above.</td></tr>
                ) : posts.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-white/50" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="p-4 font-medium" style={{ color: 'var(--color-text-primary)' }}>{p.title}</td>
                    <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: 'var(--color-secondary)', color: 'var(--color-primary-dark)' }}>{p.category}</span></td>
                    <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{p.author}</td>
                    <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button onClick={() => setEdit(p)} className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors" aria-label={`Edit ${p.title}`}>
                          <EditIcon className="w-4 h-4" />
                          Edit
                        </button>
                        <button onClick={() => setDeleteConfirm(p.id)} className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-xs font-semibold text-error hover:bg-error/10 transition-colors" aria-label={`Delete ${p.title}`}>
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
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-[16px] p-6" style={{ background: 'var(--color-bg)' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Edit Post</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {(['title', 'slug', 'author', 'category', 'coverImage'] as const).map((key) => (
                <div key={key}>
                  <label className="block mb-1.5 text-sm font-semibold capitalize" style={{ color: 'var(--color-text-primary)' }}>{key.replace(/([A-Z])/g, ' $1')}</label>
                  <input type="text" value={edit[key]} onChange={(e) => setEdit({ ...edit, [key]: e.target.value })} className="w-full h-[44px] px-4 rounded-[10px] text-sm" style={inputStyle} />
                </div>
              ))}
              <div>
                <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Read time (min)</label>
                <input type="number" min={1} value={edit.readTime} onChange={(e) => setEdit({ ...edit, readTime: Number(e.target.value) || 1 })} className="w-full h-[44px] px-4 rounded-[10px] text-sm" style={inputStyle} />
              </div>
            </div>
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Excerpt</label>
            <textarea value={edit.excerpt} onChange={(e) => setEdit({ ...edit, excerpt: e.target.value })} rows={2} className="w-full px-4 py-3 mb-3 rounded-[10px] text-sm" style={inputStyle} />
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Content</label>
            <textarea value={edit.content} onChange={(e) => setEdit({ ...edit, content: e.target.value })} rows={10} className="w-full px-4 py-3 mb-3 rounded-[10px] text-sm font-mono" style={inputStyle} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEdit(null)} className="flex-1 h-[48px] rounded-[12px] text-sm font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancel</button>
              <button onClick={handleUpdate} disabled={updatePost.isPending} className="flex-1 h-[48px] rounded-[12px] text-sm font-semibold text-white" style={{ background: 'var(--color-primary)' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-[16px] p-6 text-center" style={{ background: 'var(--color-bg)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Delete Post?</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-[48px] rounded-[12px] text-sm font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancel</button>
              <button
                onClick={() => deletePost.mutate(deleteConfirm, { onSuccess: () => setDeleteConfirm(null) })}
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
