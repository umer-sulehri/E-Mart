'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { AccessibilityControls } from '@/components/common/AccessibilityControls';
import {
  HomeIcon, PackageIcon, OrderIcon, UserIcon,
  MenuIcon, CloseIcon, SearchIcon, ChevronDownIcon, LogoutIcon,
} from '@/components/icons';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/seller/dashboard', icon: HomeIcon },
  { label: 'My Products', href: '/seller/products', icon: PackageIcon },
  { label: 'My Orders', href: '/seller/orders', icon: OrderIcon },
  { label: 'Store Profile', href: '/seller/profile', icon: UserIcon },
];

const PAGE_TITLES: Record<string, string> = {
  '/seller/dashboard': 'Dashboard',
  '/seller/products': 'My Products',
  '/seller/orders': 'My Orders',
  '/seller/profile': 'Store Profile',
  '/seller/earnings': 'Earnings',
  '/seller/reviews': 'Reviews',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/seller/products/')) return 'Edit Product';
  return 'Seller Dashboard';
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const handleLogout = useCallback(() => {
    logout();
    router.push('/');
  }, [logout, router]);

  if (!user) return null;

  const sidebarWidth = sidebarOpen ? 260 : 72;
  const pageTitle = getPageTitle(pathname);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out
          ${mobileOpen ? 'w-[260px] translate-x-0' : sidebarOpen ? 'w-[260px] max-lg:-translate-x-full' : 'w-[72px] max-lg:-translate-x-full'}
          lg:translate-x-0`}
        style={{ background: 'linear-gradient(180deg, var(--color-primary-dark) 0%, #2A4428 50%, var(--color-primary-dark) 100%)' }}
      >
        <div className="h-full overflow-y-auto scrollbar-hide px-3 py-4 flex flex-col">
          {/* Logo + close (mobile) */}
          <div className="flex items-center justify-between mb-6 px-3">
            <Link href="/seller/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
              <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{sidebarOpen || mobileOpen ? 'E-Mart' : 'EM'}</span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center lg:hidden text-text-inverse/60 hover:text-text-inverse"
              aria-label="Close sidebar"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex w-full items-center justify-center mb-4 py-2 rounded-xl text-text-inverse/40 hover:text-text-inverse/80 transition-colors"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          {/* Nav items */}
          <nav aria-label="Seller navigation">
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                        ${sidebarOpen || mobileOpen ? '' : 'justify-center'}
                        ${isActive ? 'bg-primary text-text-inverse' : 'text-text-inverse/60 hover:text-text-inverse hover:bg-white/10'}`}
                      title={!(sidebarOpen || mobileOpen) ? item.label : undefined}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/20' : ''}`}>
                        <Icon className="w-5 h-5" />
                      </span>
                      {(sidebarOpen || mobileOpen) && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Logout */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={() => setConfirmLogout(true)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-inverse/40 hover:text-text-inverse/80 hover:bg-white/10 transition-all w-full ${sidebarOpen || mobileOpen ? '' : 'justify-center'}`}
              title={!(sidebarOpen || mobileOpen) ? 'Logout' : undefined}
            >
              <LogoutIcon className="w-5 h-5 flex-shrink-0" />
              {(sidebarOpen || mobileOpen) && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Top bar */}
      <div
        className="fixed top-0 right-0 z-40 h-[64px] transition-all duration-300 hidden lg:block"
        style={{ left: sidebarWidth }}
      >
        <header className="h-full flex items-center justify-between px-6 border-b" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-text-primary)' }}
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 h-[40px] rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <SearchIcon className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm outline-none w-40 placeholder:opacity-60"
                style={{ color: 'var(--color-text-primary)' }}
                aria-label="Search"
              />
            </div>
            <LanguageSwitcher />
            <AccessibilityControls />
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-colors hover:opacity-80"
                aria-label="User menu"
                aria-expanded={userMenuOpen}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--color-primary)' }}>
                  {user?.name?.charAt(0) || 'S'}
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{user?.name || 'Seller'}</span>
                <ChevronDownIcon className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-[16px] overflow-hidden z-50 shadow-lg" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                    <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{user?.name || 'Seller'}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{user?.email || ''}</p>
                    </div>
                    <Link href="/seller/profile" className="block px-4 py-3 text-sm transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary)' }} onClick={() => setUserMenuOpen(false)}>Profile</Link>
                    <Link href="/seller/earnings" className="block px-4 py-3 text-sm transition-colors hover:opacity-80" style={{ color: 'var(--color-text-secondary)' }} onClick={() => setUserMenuOpen(false)}>Earnings</Link>
                    <button onClick={() => { setConfirmLogout(true); setUserMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm transition-colors hover:opacity-80" style={{ color: 'var(--color-error)' }}>Sign out</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* Mobile top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-[64px] flex items-center justify-between px-4 border-b lg:hidden" style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center hover:opacity-80" style={{ color: 'var(--color-text-primary)' }} aria-label="Open sidebar">
            <MenuIcon className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <AccessibilityControls />
        </div>
      </header>

      {/* Main content */}
      <main
        className="transition-all duration-300 pt-[64px] min-h-screen lg:[margin-left:var(--sbw)]"
        style={{ '--sbw': `${sidebarWidth}px`, background: 'var(--color-bg)' } as React.CSSProperties}
      >
        <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>

      {/* Logout confirmation modal */}
      {confirmLogout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={() => setConfirmLogout(false)}>
          <div className="w-full max-w-sm rounded-[16px] p-6 text-center shadow-xl" style={{ background: 'var(--color-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Sign out?</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>You will be redirected to the homepage.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmLogout(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancel</button>
              <button onClick={handleLogout} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--color-error)' }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
