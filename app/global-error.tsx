'use client';

import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="m-0 bg-secondary-800 p-0 font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
              <AlertTriangle size={32} className="text-danger" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-secondary-800">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm font-medium text-danger">
              E-Mart
            </p>
            <p className="mt-3 text-sm text-muted-500">
              An unexpected error occurred. Please try again or return to the homepage.
            </p>
            {error.message && (
              <p className="mt-4 rounded-lg bg-muted-50 p-3 text-xs text-muted-500">
                {error.message}
              </p>
            )}
            {error.digest && (
              <p className="mt-2 text-xs text-muted-400">
                Error ID: {error.digest}
              </p>
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-muted-200 bg-white px-6 py-3 text-sm font-semibold text-secondary-700 shadow-sm transition-colors hover:bg-muted-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <Home size={16} />
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
