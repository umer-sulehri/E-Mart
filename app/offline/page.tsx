import type { Metadata } from 'next';
import Link from 'next/link';
import { WifiOff, Home } from 'lucide-react';

export const metadata: Metadata = {
  title: 'You are offline',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted-100 text-muted-500">
        <WifiOff className="size-8" aria-hidden="true" />
      </div>
      <h1 className="mt-6 font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
        You&apos;re offline
      </h1>
      <p className="mt-3 max-w-md text-sm text-secondary-600">
        E-Mart needs an internet connection to load fresh prices and stock.
        Check your connection and try again.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700"
      >
        <Home className="size-4" aria-hidden="true" />
        Try again
      </Link>
    </section>
  );
}
