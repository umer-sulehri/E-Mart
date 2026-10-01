'use client';

import { toast } from 'react-hot-toast';

/**
 * The refusal shown when a product from another category is added to a tray
 * that is already locked to one.
 *
 * Kept in its own component because the wording is only useful if it is paired
 * with the one action that resolves it: without a "clear and start again" button
 * the message is just an obstacle, and the shopper has to find the compare page
 * and press Clear All themselves.
 *
 * Lives in a `.tsx` file deliberately — the hook that calls it stays JSX-free.
 */
export function showCompareMismatchToast(options: {
  message: string;
  /** Clears the tray and starts a new comparison with this product. */
  onClearAndAdd: () => void;
}): void {
  toast.custom(
    (t) => (
      <div
        role="alert"
        className="flex max-w-sm flex-col gap-3 rounded-xl bg-secondary-800 px-4 py-3 text-sm text-white shadow-lg"
      >
        <p className="font-medium">{options.message}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={options.onClearAndAdd}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Clear &amp; add this instead
          </button>
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="text-xs font-medium text-muted-200 underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Keep current list
          </button>
        </div>
      </div>
    ),
    // Longer than the 3s default: this one carries an action to read and press.
    { duration: 8000 }
  );
}
