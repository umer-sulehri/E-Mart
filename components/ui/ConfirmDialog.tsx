'use client';

import { useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: ConfirmVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

const variantConfig: Record<
  ConfirmVariant,
  {
    icon: typeof AlertTriangle;
    iconClass: string;
    btnVariant: 'danger' | 'warning' | 'primary';
  }
> = {
  danger: { icon: Trash2, iconClass: 'text-danger', btnVariant: 'danger' },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-warning',
    btnVariant: 'warning',
  },
  info: { icon: Info, iconClass: 'text-primary', btnVariant: 'primary' },
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'danger',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-400 transition-colors hover:text-secondary"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div
            className={cn(
              'mb-4 flex h-14 w-14 items-center justify-center rounded-full',
              variant === 'danger' && 'bg-danger/10',
              variant === 'warning' && 'bg-warning/10',
              variant === 'info' && 'bg-primary/10'
            )}
          >
            <Icon size={28} className={config.iconClass} />
          </div>

          <h3
            id="confirm-dialog-title"
            className="text-lg font-bold font-heading text-secondary-800"
          >
            {title}
          </h3>
          <p className="mt-2 text-sm text-muted-500">{message}</p>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={config.btnVariant}
            className="flex-1"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
