'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { useHydratedAuth } from '@/hooks/useHydratedAuth';
import { signOut } from '@/lib/auth/signOut';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { AccessibilityControls } from '@/components/common/AccessibilityControls';
import {
  HomeIcon, PackageIcon, HeartIcon, UserIcon, BellIcon, LogoutIcon,
  LockIcon, MapPinIcon,
} from '@/components/icons';

const MOBILE_NAV_ITEMS = [
  { label: 'Home', href: '/user/dashboard', icon: HomeIcon },
  { label: 'Orders', href: '/user/orders', icon: PackageIcon },
  { label: 'Wishlist', href: '/user/wishlist', icon: HeartIcon },
  { label: 'Profile', href: '/user/profile', icon: UserIcon },
];

const DESKTOP_NAV_ITEMS = [
  ...MOBILE_NAV_ITEMS,
  { label: 'Notifications', href: '/user/notifications', icon: BellIcon },
  { label: 'Change Password', href: '/user/change-password', icon: LockIcon },
  { label: 'Addresses', href: '/user/addresses', icon: MapPinIcon },
];

const PAGE_TITLES: Record<string, string> = {
  '/user/dashboard': 'Dashboard',
  '/user/orders': 'My Orders',
  '/user/wishlist': 'Wishlist',
  '/user/profile': 'Profile',
  '/user/notifications': 'Notifications',
  '/user/reviews': 'Reviews',
  '/user/change-password': 'Change Password',
  '/user/addresses': 'My Addresses',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/user/orders/')) return 'Order Details';
  return 'Dashboard';
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();
  const hydrated = useHydratedAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) router.push('/login');
  }, [hydrated, isAuthenticated, router]);

  const handleLogout = async () => {
    await signOut();
    logout();
    router.push('/');
    setConfirmLogout(false);
  };

  if (!hydrated || !isAuthenticated) return null;

  const pageTitle = getPageTitle(pathname);
  const displayName = user?.name || 'there';

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Desktop sidebar */}
      <aside
        className="fixed top-0 left-0 z-50 h-screen w-[240px] max-lg:-translate-x-full max-lg:hidden rounded-r-[16px] flex flex-col"
        style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
      >
        <div className="px-5 pt-6 pb-4">
          <Link href="/user/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold" style={{ color: 'var(--color-primary-dark)' }}>E-Mart</span>
          </Link>
        </div>

        <nav aria-label="User navigation" className="px-3 flex-1">
          <ul className="flex flex-col gap-1">
            {DESKTOP_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{
                      background: isActive ? 'var(--color-primary)' : 'transparent',
                      color: isActive ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                    }}
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent' }}
                    >
                      <Icon className="w-5 h-5" />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-3 pb-4">
          <button
            onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-error)'; e.currentTarget.style.background = 'rgba(182,92,75,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogoutIcon className="w-5 h-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Desktop top bar */}
      <div className="fixed top-0 right-0 z-40 h-[64px] max-lg:hidden transition-all duration-300" style={{ left: 240 }}>
        <header
          className="h-full flex items-center justify-between px-6"
          style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
        >
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{pageTitle}</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <AccessibilityControls />
            <div
              className="flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full"
              style={{ background: 'var(--color-surface)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Hi, {displayName}!
              </span>
            </div>
          </div>
        </header>
      </div>

      {/* Mobile top bar */}
      <header
        className="fixed top-0 left-0 right-0 z-40 h-[64px] flex items-center justify-between px-4 lg:hidden"
        style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <Link href="/user/dashboard" className="text-lg font-bold" style={{ color: 'var(--color-primary-dark)' }}>
            E-Mart
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <AccessibilityControls />
        </div>
      </header>

      {/* Main content */}
      <main className="transition-all duration-300 max-lg:pt-[64px] max-lg:pb-20 lg:pt-[64px] lg:pl-[240px] min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <div className="p-4 lg:px-6 lg:py-4 max-w-[1200px] mx-auto">
          <div className="mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Hi, {displayName}!
            </h2>
          </div>
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden flex items-center justify-around h-[64px]"
        style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}
        aria-label="Mobile navigation"
      >
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-200"
              style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout confirmation modal */}
      {confirmLogout && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setConfirmLogout(false)}
        >
          <div
            className="w-full max-w-sm rounded-[16px] p-6 text-center shadow-xl"
            style={{ background: 'var(--color-bg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Sign out?</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>You will be redirected to the homepage.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border"
                style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--color-error)', color: 'var(--color-text-inverse)' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


