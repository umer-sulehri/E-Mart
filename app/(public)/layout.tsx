'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartSidebar from '@/components/cart/CartSidebar';
import BackToTop from '@/components/ui/BackToTop';
import CookieConsent from '@/components/ui/CookieConsent';
import Preloader from '@/components/layout/Preloader';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Preloader />
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-organic">{children}</div>
      </main>
      <Footer />
      <CartSidebar />
      <BackToTop />
      <CookieConsent />
    </div>
  );
}
