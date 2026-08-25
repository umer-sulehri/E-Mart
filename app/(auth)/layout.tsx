import Link from 'next/link';
import { Leaf } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-primary transition-colors hover:text-primary-500">
            <Leaf className="h-8 w-8" />
            <span className="text-2xl font-bold font-heading text-secondary">E-Mart</span>
          </Link>
        </div>
        <div className="rounded-2xl border border-muted-200 bg-white p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
