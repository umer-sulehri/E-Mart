'use client';

import Link from 'next/link';
import { AlertTriangle, RefreshCw, ShoppingCart } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
          <AlertTriangle size={32} className="text-danger" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-secondary-800">
          Checkout Error
        </h1>
        <p className="mt-3 text-sm text-muted-500">
          Something went wrong during checkout. Your cart items are safe.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-400">
            Error ID: {error.digest}
          </p>
        )}
        {error.message && (
          <p className="mt-4 rounded-lg bg-muted-50 p-3 text-xs text-muted-500">
            {error.message}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="primary" size="lg" onClick={reset}>
            <RefreshCw size={16} />
            Try Again
          </Button>
          <Link href="/cart">
            <Button variant="outline" size="lg">
              <ShoppingCart size={16} />
              Back to Cart
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
