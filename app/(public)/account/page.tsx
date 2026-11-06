'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { getRoleHomeHref } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace(getRoleHomeHref(user?.role));
    } else {
      router.replace('/login?redirect=/account');
    }
  }, [isAuthenticated, isLoading, router, user?.role]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={32} className="animate-spin text-primary-600" />
        <p className="text-sm text-muted-500">Redirecting...</p>
      </div>
    </div>
  );
}
