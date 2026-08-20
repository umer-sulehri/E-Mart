'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';

const DASHBOARD_PREFIXES = ['/admin', '/seller', '/user'];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p));

  if (isDashboard) {
    return (
      <>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary focus:text-text-inverse focus:px-4 focus:py-2 focus:rounded-[12px] focus:text-sm focus:font-semibold">
          Skip to content
        </a>
        <main id="main-content" className="flex-1 min-h-screen">{children}</main>
      </>
    );
  }

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary focus:text-text-inverse focus:px-4 focus:py-2 focus:rounded-[12px] focus:text-sm focus:font-semibold">
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
