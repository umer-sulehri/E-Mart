'use client';

import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface CompareCategoryDialogProps {
  open: boolean;
  /** Display name of the category the existing comparison belongs to. */
  activeCategory: string;
  /** Display name of the category of the product the user tried to add. */
  incomingCategory: string;
  onClose: () => void;
  /** Discard the current comparison and add the incoming product instead. */
  onStartOver: () => void;
}

/**
 * Shown when a product is added to a comparison built from a different
 * category. A comparison is only meaningful within one category — the spec
 * table shares no rows across categories — so the user either abandons the
 * current comparison or leaves it untouched.
 *
 * Composed from ConfirmDialog to reuse its focus handling, Escape-to-close and
 * body scroll lock rather than reimplementing a modal.
 */
export default function CompareCategoryDialog({
  open,
  activeCategory,
  incomingCategory,
  onClose,
  onStartOver,
}: CompareCategoryDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onStartOver}
      variant="info"
      title="Different category"
      message={`You can only compare products from the same category. This comparison is in ${activeCategory}, but the product you picked is in ${incomingCategory}. Start a new comparison with it?`}
      confirmLabel="Start new comparison"
      cancelLabel="Keep current comparison"
    />
  );
}
