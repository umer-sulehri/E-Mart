'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartSidebar from '@/components/cart/CartSidebar';
import BackToTop from '@/components/ui/BackToTop';
import CookieConsent from '@/components/ui/CookieConsent';
import Preloader from '@/components/layout/Preloader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Preloader />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="flex-1 scroll-mt-24 pb-16 lg:pb-0">
        <div className="mx-auto max-w-organic">{children}</div>
      </main>
      <Footer />
      <CartSidebar />
      <BackToTop />
      <CookieConsent />
      <MobileBottomNav />
    </div>
  );
}
