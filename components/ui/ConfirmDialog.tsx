'use client';

import { useRef } from 'react';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useBodyScrollLock, useEscapeKey } from '@/hooks/useOverlay';
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

  useBodyScrollLock(open);
  useEscapeKey(open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Bottom sheet on phones so the buttons clear the mobile nav and the
          safe-area inset; centred card from `sm` up. */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative flex max-h-[85vh] w-full flex-col overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:max-h-[90vh] sm:rounded-2xl sm:pb-6"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 -mr-2 -mt-2 flex h-11 w-11 items-center justify-center rounded-full text-muted-400 transition-colors hover:bg-muted-100 hover:text-secondary"
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
          <p className="mt-2 break-words text-sm text-muted-500">{message}</p>
        </div>

        {/* Sticky so Confirm stays reachable when the message scrolls. */}
        <div className="mt-6 flex shrink-0 gap-3">
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
