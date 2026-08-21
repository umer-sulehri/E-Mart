'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useUiStore } from '@/lib/store/uiStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useTranslations } from '@/hooks/useTranslations';
import { useHydrated } from '@/hooks/useHydrated';
import { mockCategories } from '@/lib/mock/products';
import { IconButton } from '@/components/ui/Icon';
import { ShoppingCartIcon, UserIcon, MenuIcon, CloseIcon, HeartIcon } from '@/components/icons';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { SearchBar } from '@/components/search/SearchBar';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const hydrated = useHydrated();
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const cartOpen = useUiStore((s) => s.cartOpen);
  const { user, currentMode, switchMode } = useAuthStore();
  const { t } = useTranslations();
  const catTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  return (
    <>
      {/* Top Bar */}
      <div className="text-xs hidden md:block" style={{ background: 'var(--color-primary-dark)', color: 'rgba(255,255,255,0.8)' }}>
        <div className="max-w-7xl mx-auto px-4 h-[36px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span style={{ color: '#d8ee68' }}>Free Delivery on Orders Over Rs 2,000</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span>24/7 Customer Support</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/user/orders" className="hover:opacity-80 transition-colors min-h-[32px] inline-flex items-center">{t('nav.orders')}</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 h-[64px] flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'} className="sm:hidden min-w-[48px] min-h-[48px] flex items-center justify-center rounded-[10px] hover:bg-bg transition-colors">
            {mobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>

          <Link href="/" className="flex-shrink-0" aria-label="E-Mart Home">
            <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--color-primary)' }}>E-Mart</h1>
          </Link>

          <div className="flex-1 hidden sm:flex items-center max-w-xl mx-auto">
            <SearchBar />
          </div>

          <div className="flex items-center gap-1">
            <div className="sm:hidden">
              <LanguageSwitcher />
            </div>
            <Link href="/wishlist" className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full hover:bg-surface transition-colors relative" aria-label="Wishlist">
              <HeartIcon className="w-6 h-6" />
              {hydrated && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1 text-text-inverse text-[11px] font-bold rounded-full leading-none" style={{ background: 'var(--color-primary)' }}>
                  {wishlistCount}
                </span>
              )}
            </Link>
            <IconButton label="Shopping Cart" onClick={() => setCartOpen(true)} badge={hydrated ? itemCount : 0}>
              <ShoppingCartIcon className="w-6 h-6" />
            </IconButton>
            {hydrated && user ? (
              <div className="flex items-center gap-2">
                {(user.role === 'seller' || user.role === 'admin') && (
                  <div className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer transition-all duration-300" style={{ background: currentMode === 'seller' ? 'var(--color-primary)' : 'rgba(122,155,118,0.15)', color: currentMode === 'seller' ? 'white' : 'var(--color-text-primary)', border: '2px solid var(--color-primary)' }} onClick={() => switchMode(currentMode === 'buyer' ? 'seller' : 'buyer')}>
                    <span className="text-xs font-semibold">{currentMode === 'seller' ? 'Seller Mode' : 'Buyer Mode'}</span>
                  </div>
                )}
                <Link href={user.role === 'admin' ? '/admin/dashboard' : currentMode === 'seller' ? '/seller/dashboard' : '/user/dashboard'} className="flex items-center gap-2 px-3 py-2 rounded-[10px] hover:bg-bg transition-colors min-h-[48px]">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden lg:block text-sm font-semibold text-text-primary">{user.name}</span>
                </Link>
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-2 px-3 py-2 rounded-[10px] hover:bg-bg transition-colors min-h-[48px]">
                <UserIcon className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <span className="hidden lg:block text-sm font-semibold text-text-primary">{t('nav.login')}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        {mobileMenuOpen && (
          <div className="sm:hidden px-4 pb-3">
            <SearchBar />
          </div>
        )}

        {/* Category Navigation */}
        <div className="border-t border-border bg-bg/50 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 h-[44px] flex items-center gap-1">
            <div className="relative" onMouseEnter={() => { clearTimeout(catTimeoutRef.current!); setCategoryOpen(true); }} onMouseLeave={() => { catTimeoutRef.current = setTimeout(() => setCategoryOpen(false), 200); }}>
              <button className="flex items-center gap-2 h-[44px] px-4 text-text-inverse text-sm font-semibold rounded-t-[8px] transition-colors" style={{ background: 'var(--color-primary)' }}>
                <MenuIcon className="w-4 h-4" />
                All Categories
              </button>
              {categoryOpen && (
                <div className="absolute top-full left-0 w-[280px] bg-surface border border-border rounded-b-[10px] shadow-lg z-50 py-2">
                  {mockCategories.map(cat => (
                    <Link key={cat.id} href={`/categories/${cat.slug}`} className="flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-bg transition-colors min-h-[48px]" onClick={() => setCategoryOpen(false)}>
                      <span className="text-xl">{cat.icon}</span>
                      <span className="font-medium">{cat.name}</span>
                      {cat.children && cat.children.length > 0 && (
                        <span className="ml-auto text-text-secondary text-xs">{cat.children.length}+</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <nav className="flex items-center gap-1 ml-1" aria-label="Main navigation">
              {[
                { href: '/', label: t('nav.home') },
                { href: '/products', label: t('nav.products') },
                { href: '/categories', label: t('home.shopByCategory') },
              ].map(link => (
                <Link key={link.href} href={link.href} className="h-[44px] flex items-center px-3 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface rounded-[6px] transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="sm:hidden bg-surface border-t border-border px-4 py-4" aria-label="Mobile navigation">
            <div className="flex flex-col gap-1">
              {[
                { href: '/', label: t('nav.home') },
                { href: '/products', label: t('nav.products') },
                { href: '/categories', label: t('home.shopByCategory') },
                { href: '/user/orders', label: t('nav.orders') },
                { href: '/login', label: t('nav.login') },
              ].map(link => (
                <Link key={link.href} href={link.href} className="h-[48px] flex items-center gap-3 px-4 rounded-[12px] text-text-primary hover:bg-bg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 px-4">{t('home.shopByCategory')}</p>
              <div className="grid grid-cols-3 gap-2">
                {mockCategories.map(cat => (
                  <Link key={cat.id} href={`/categories/${cat.slug}`} className="flex flex-col items-center gap-1 p-3 bg-bg rounded-[10px] text-center hover:bg-surface-alt transition-colors min-h-[48px]" onClick={() => setMobileMenuOpen(false)}>
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-xs font-medium text-text-primary line-clamp-1">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        )}

        <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      </header>
    </>
  );
}
