'use client';

import { useRef, useState } from 'react';
import { Loader2, RefreshCw, UploadCloud, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import ImageWithFallback from '@/components/ui/ImageWithFallback';

type UploadStatus = 'idle' | 'uploading' | 'error';

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  bucket?: 'products' | 'blog' | 'vendor-assets' | 'uploads';
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
}

export default function ImageUploader({
  value,
  onChange,
  bucket = 'products',
  folder = '',
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  maxSizeMB = 10,
  disabled,
  className = '',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (status === 'uploading') return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setStatus('error');
      setError(`File must be smaller than ${maxSizeMB}MB`);
      return;
    }

    setStatus('uploading');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      if (folder) formData.append('folder', folder);

      const res = await fetch('/api/v1/uploads', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Upload failed');
      }
      onChange(json.data.url);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  return (
    <div className={className}>
      {error && (
        <p className="mb-2 text-sm text-error-600">{error}</p>
      )}

      <div className="flex items-start gap-3">
        <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-muted-200 bg-muted-50">
          {value ? (
            <>
              <ImageWithFallback
                src={value}
                alt="Upload preview"
                fill
                className="object-cover"
                sizes="96px"
              />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => { onChange(''); setStatus('idle'); setError(null); }}
                className="absolute right-1 top-1 rounded-full bg-secondary-800/70 p-1 text-white transition-colors hover:bg-secondary-800 disabled:opacity-50"
                disabled={status === 'uploading' || disabled}
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <UploadCloud className="h-8 w-8 text-muted-400" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            disabled={status === 'uploading' || disabled}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={status === 'uploading' || disabled}
          >
            {status === 'uploading' ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <UploadCloud size={14} /> {value ? 'Replace' : 'Upload'}
              </>
            )}
          </Button>
          {status === 'error' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { inputRef.current?.click(); }}
            >
              <RefreshCw size={14} /> Retry
            </Button>
          )}
          <p className="text-xs text-muted-500">
            PNG, JPG or WebP up to {maxSizeMB}MB
          </p>
        </div>
      </div>
    </div>
  );
}
