'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Store } from 'lucide-react';
import Button from '@/components/ui/Button';
import { logger } from '@/lib/logger';

export default function SellerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('SellerErrorBoundary', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
          <AlertTriangle size={32} className="text-danger" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-secondary-800">
          Seller Panel Error
        </h1>
        <p className="mt-3 text-sm text-muted-500">
          Something went wrong while loading this seller module. Please try again.
        </p>
        {error.message && (
          <p className="mt-4 rounded-lg bg-muted-50 p-3 text-xs text-muted-500">
            {error.message}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="primary" size="lg" onClick={reset}>
            <RefreshCw size={16} />
            Retry
          </Button>
          <Link href="/seller">
            <Button variant="outline" size="lg">
              <Store size={16} />
              Seller Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}