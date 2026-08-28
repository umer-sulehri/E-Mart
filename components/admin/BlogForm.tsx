'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { cn, slugify } from '@/lib/utils';
import toast from 'react-hot-toast';

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  cover_image: string;
  is_published: boolean;
}

interface BlogFormProps {
  mode: 'add' | 'edit';
  initialData?: Partial<BlogFormData>;
  onSubmit: (data: BlogFormData) => Promise<void>;
}

export default function BlogForm({ mode, initialData, onSubmit }: BlogFormProps) {
  const [form, setForm] = useState<BlogFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    cover_image: '',
    is_published: false,
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof BlogFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const onTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const uploadCover = async (file: File) => {
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', 'blog');
      fd.append('folder', 'covers');
      const res = await fetch('/api/v1/uploads', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) {
        setForm((prev) => ({ ...prev, cover_image: json.data.url }));
        toast.success('Cover image uploaded');
      } else {
        toast.error(json.error || 'Upload failed');
      }
    } catch {
      toast.error('Cover upload failed');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    setCoverFile(file);
    uploadCover(file);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.slug.trim()) newErrors.slug = 'Slug is required';
    if (!form.excerpt.trim()) newErrors.excerpt = 'Excerpt is required';
    if (!form.content.trim()) newErrors.content = 'Content is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        slug: form.slug || slugify(form.title),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-bold text-secondary-800">Article Content</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              label="Title"
              placeholder="Enter post title"
              value={form.title}
              onChange={(e) => onTitleChange(e.target.value)}
              error={errors.title}
            />
          </div>
          <div>
            <Input
              label="Slug"
              placeholder="enter-post-slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                updateField('slug', slugify(e.target.value));
              }}
              error={errors.slug}
            />
          </div>
          <Input
            label="Category"
            placeholder="e.g. Health, Recipes"
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
          />
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-secondary-800">
              Excerpt
            </label>
            <textarea
              rows={2}
              placeholder="Short summary shown in listings"
              value={form.excerpt}
              onChange={(e) => updateField('excerpt', e.target.value)}
              className={cn(
                'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                errors.excerpt ? 'border-danger' : 'border-muted-200'
              )}
            />
            {errors.excerpt && <p className="mt-1.5 text-xs text-danger">{errors.excerpt}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-secondary-800">
              Content
            </label>
            <textarea
              rows={12}
              placeholder="Write the full article content here..."
              value={form.content}
              onChange={(e) => updateField('content', e.target.value)}
              className={cn(
                'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                errors.content ? 'border-danger' : 'border-muted-200'
              )}
            />
            {errors.content && <p className="mt-1.5 text-xs text-danger">{errors.content}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-lg font-bold text-secondary-800">Featured Image</h3>
        <p className="mb-4 text-sm text-muted-500">Used as the cover image on the blog listing and article page.</p>

        {form.cover_image ? (
          <div className="relative w-full max-w-sm overflow-hidden rounded-lg border border-muted-200">
            <Image
              src={form.cover_image}
              alt="Featured"
              width={640}
              height={360}
              className="h-48 w-full object-cover"
            />
            {coverUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setForm((prev) => ({ ...prev, cover_image: '' }));
                setCoverFile(null);
              }}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-danger"
              aria-label="Remove cover image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-40 w-full max-w-sm flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-200 transition-colors hover:border-primary hover:bg-muted-50"
          >
            <Upload className="mb-2 h-8 w-8 text-muted-400" />
            <p className="text-sm font-medium text-muted-600">Upload cover image</p>
            <p className="text-xs text-muted-400">JPG, PNG, WebP up to 5MB</p>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverChange}
        />
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-secondary-800">Publication</h3>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => updateField('is_published', e.target.checked)}
            className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary/20"
          />
          <span className="text-sm font-medium text-secondary-800">
            Publish immediately
          </span>
        </label>
        <p className="mt-1 text-xs text-muted-500">
          When disabled, the post is saved as a draft.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : mode === 'add' ? (
            'Create Post'
          ) : (
            'Update Post'
          )}
        </Button>
      </div>
    </form>
  );
}
