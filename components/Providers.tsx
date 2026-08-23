'use client';

import { useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/lib/store/uiStore';
import { useCartStore } from '@/lib/store/cartStore';
import { hydrateWishlistFromServer } from '@/lib/store/wishlistSync';
import { ToastProvider } from '@/components/ui/Toast';
import { QueryProvider } from '@/components/QueryProvider';

function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const locale = useUiStore((s) => s.locale);
  const highContrast = useUiStore((s) => s.highContrast);

  useEffect(() => {
    useUiStore.persist.rehydrate();
    useCartStore.persist.rehydrate();
    void hydrateWishlistFromServer();
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', locale);
    html.setAttribute('dir', locale === 'ur' ? 'rtl' : 'ltr');
    if (highContrast) {
      html.classList.add('high-contrast');
    } else {
      html.classList.remove('high-contrast');
    }
  }, [locale, highContrast]);

  return (
    <QueryProvider>
      <ToastProvider>
        <ScrollToTop />
        {children}
      </ToastProvider>
    </QueryProvider>
  );
}
