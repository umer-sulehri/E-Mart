'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Star } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface ProductFormData {
  name: string;
  description: string;
  category: string;
  brand: string;
  sku: string;
  price: string;
  salePrice: string;
  stockQuantity: string;
  weight: string;
  images: { file: File; preview: string; alt: string }[];
  status: 'active' | 'draft';
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  mode: 'add' | 'edit';
  onSubmit: (data: ProductFormData) => void;
}

const defaultData: ProductFormData = {
  name: '',
  description: '',
  category: '',
  brand: '',
  sku: '',
  price: '',
  salePrice: '',
  stockQuantity: '',
  weight: '',
  images: [],
  status: 'active',
};

export default function ProductForm({ initialData, mode, onSubmit }: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>({
    ...defaultData,
    ...initialData,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof ProductFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const newImages = Array.from(files)
        .filter((f) => f.type.startsWith('image/'))
        .slice(0, 5 - form.images.length)
        .map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          alt: file.name.replace(/\.[^.]+$/, ''),
        }));
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages].slice(0, 5),
      }));
    },
    [form.images.length]
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0) return;
    setForm((prev) => {
      const images = [...prev.images];
      const [moved] = images.splice(index, 1);
      images.unshift(moved);
      return { ...prev, images };
    });
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!form.name.trim()) newErrors.name = 'Product name is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.category) newErrors.category = 'Category is required';
    if (!form.sku.trim()) newErrors.sku = 'SKU is required';
    if (!form.price || parseFloat(form.price) <= 0) newErrors.price = 'Valid price is required';
    if (form.salePrice && parseFloat(form.salePrice) >= parseFloat(form.price)) {
      newErrors.salePrice = 'Sale price must be less than regular price';
    }
    if (!form.stockQuantity || parseInt(form.stockQuantity) < 0) {
      newErrors.stockQuantity = 'Valid stock quantity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-bold text-secondary-800">Basic Information</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              label="Product Name"
              placeholder="Enter product name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              error={errors.name}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-secondary-800">
              Description
            </label>
            <textarea
              rows={5}
              placeholder="Enter product description (Markdown supported)"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className={cn(
                'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-secondary-800',
                'placeholder:text-muted-400 transition-colors',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                errors.description ? 'border-danger' : 'border-muted-200'
              )}
            />
            {errors.description && (
              <p className="mt-1.5 text-xs text-danger">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-muted-500">
              Supports Markdown formatting for rich text descriptions.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary-800">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => updateField('category', e.target.value)}
              className={cn(
                'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-secondary-800',
                'transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                errors.category ? 'border-danger' : 'border-muted-200'
              )}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1.5 text-xs text-danger">{errors.category}</p>
            )}
          </div>
          <Input
            label="Brand"
            placeholder="Enter brand name"
            value={form.brand}
            onChange={(e) => updateField('brand', e.target.value)}
          />
        </div>
      </div>

      {/* Pricing & Inventory */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-bold text-secondary-800">Pricing & Inventory</h3>
        <div className="grid gap-6 md:grid-cols-3">
          <Input
            label="SKU"
            placeholder="e.g. PRD-001"
            value={form.sku}
            onChange={(e) => updateField('sku', e.target.value)}
            error={errors.sku}
          />
          <Input
            label="Price (PKR)"
            type="number"
            placeholder="0"
            min="0"
            value={form.price}
            onChange={(e) => updateField('price', e.target.value)}
            error={errors.price}
          />
          <Input
            label="Sale Price (PKR) — Optional"
            type="number"
            placeholder="0"
            min="0"
            value={form.salePrice}
            onChange={(e) => updateField('salePrice', e.target.value)}
            error={errors.salePrice}
          />
          <Input
            label="Stock Quantity"
            type="number"
            placeholder="0"
            min="0"
            value={form.stockQuantity}
            onChange={(e) => updateField('stockQuantity', e.target.value)}
            error={errors.stockQuantity}
          />
          <Input
            label="Weight (grams)"
            type="number"
            placeholder="0"
            min="0"
            value={form.weight}
            onChange={(e) => updateField('weight', e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary-800">Status</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => updateField('status', 'active')}
                className={cn(
                  'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                  form.status === 'active'
                    ? 'border-success bg-success text-white'
                    : 'border-muted-200 text-muted-600 hover:bg-muted-50'
                )}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => updateField('status', 'draft')}
                className={cn(
                  'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                  form.status === 'draft'
                    ? 'border-warning bg-warning text-white'
                    : 'border-muted-200 text-muted-600 hover:bg-muted-50'
                )}
              >
                Draft
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Images */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-lg font-bold text-secondary-800">Product Images</h3>
        <p className="mb-6 text-sm text-muted-500">
          Upload up to 5 images. The first image will be the primary display image.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {form.images.map((img, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-lg border-2 border-dashed border-muted-200"
            >
              <img
                src={img.preview}
                alt={img.alt}
                className="h-40 w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setPrimaryImage(index)}
                  className={cn(
                    'rounded-lg p-2 text-white transition-colors',
                    index === 0 ? 'bg-primary' : 'bg-white/20 hover:bg-white/40'
                  )}
                  title="Set as primary"
                >
                  <Star className="h-4 w-4" fill={index === 0 ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="rounded-lg bg-white/20 p-2 text-white transition-colors hover:bg-danger"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {index === 0 && (
                <span className="absolute left-2 top-2">
                  <Badge variant="primary" size="sm">Primary</Badge>
                </span>
              )}
            </div>
          ))}

          {form.images.length < 5 && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
                dragActive
                  ? 'border-primary bg-primary-50'
                  : 'border-muted-200 hover:border-primary hover:bg-muted-50'
              )}
            >
              <Upload className="mb-2 h-8 w-8 text-muted-400" />
              <p className="text-sm font-medium text-muted-600">
                Drag & drop or click
              </p>
              <p className="text-xs text-muted-400">PNG, JPG up to 5MB</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {form.images.length === 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-warning-50 p-3 text-sm text-warning-700">
            <ImageIcon className="h-4 w-4 shrink-0" />
            No images uploaded yet. Add at least one product image.
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <Button type="submit" size="lg">
          {mode === 'add' ? 'Save Product' : 'Update Product'}
        </Button>
        <Button type="button" variant="ghost" size="lg">
          Cancel
        </Button>
      </div>
    </form>
  );
}
