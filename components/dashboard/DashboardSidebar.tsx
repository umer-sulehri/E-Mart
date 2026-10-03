'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useBodyScrollLock, useEscapeKey } from '@/hooks/useOverlay';
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  User,
  Lock,
  LogOut,
  Menu,
  X,
  Leaf,
  Star,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Orders', href: '/dashboard/orders', icon: Package },
  { label: 'My Reviews', href: '/dashboard/reviews', icon: Star },
  { label: 'Wishlist', href: '/dashboard/wishlist', icon: Heart },
  { label: 'My Addresses', href: '/dashboard/addresses', icon: MapPin },
  { label: 'Profile Settings', href: '/dashboard/profile', icon: User },
  { label: 'Change Password', href: '/dashboard/change-password', icon: Lock },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  useBodyScrollLock(mobileOpen);
  useEscapeKey(mobileOpen, closeMobile);

  // The menu is taller than a phone viewport, so the current section can sit
  // below the fold when the drawer opens. Scroll it back into view, otherwise
  // opening the menu on `/dashboard/change-password` shows only the top links
  // with no sign of where you are. `block: 'nearest'` keeps the panel from
  // scrolling when the link is already visible.
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [pathname, mobileOpen]);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U';

  const sidebarContent = (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-3 border-b border-muted-200 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-secondary-800">
            {user ? `${user.firstName} ${user.lastName}` : 'User'}
          </p>
          <p className="truncate text-xs text-muted-500">
            {user?.email ?? 'user@example.com'}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navLinks.map((link) => {
          const isActive =
            link.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(link.href);
return (
            <Link
              key={link.href}
              href={link.href}
              ref={isActive ? activeRef : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-l-[3px] border-primary bg-primary-50 text-primary-600'
                  : 'text-muted-600 hover:bg-muted-50 hover:text-secondary-800'
              )}
            >
              <link.icon className="size-5 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-muted-200 p-4">
        <button
          onClick={async () => {
            try {
              await fetch('/api/v1/auth/logout', { method: 'POST' });
            } catch {}
            logout();
            setMobileOpen(false);
            router.push('/login');
          }}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-50"
        >
          <LogOut className="size-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
        aria-controls="app-sidebar"
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-lg bg-white shadow-md lg:hidden"
      >
        <Menu className="size-5 text-secondary-800" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

{/* Mobile sidebar */}
      <aside
        id="app-sidebar"
        className={cn(
          // The nav is far taller than a phone viewport, so a scroll container
          // is mandatory - otherwise the lower links and Logout are
          // unreachable. The panel itself must NOT be that container: it is a
          // column flexbox, and a flex item's default `min-height: auto` stops
          // the child shrinking to the viewport, so the panel grows instead of
          // scrolling and the page scrolls behind a locked body. Scrolling
          // lives on an explicit `min-h-0 flex-1` region below instead.
          // `h-[100dvh]` rather than `inset-y-0`: the latter sizes against the
          // layout viewport, so on a phone the drawer runs under the browser
          // chrome and its footer sits off-screen.
          'fixed left-0 top-0 z-50 flex h-[100dvh] w-72 max-w-[85vw] flex-col bg-white shadow-lg transition-transform lg:hidden',
          // Hidden rather than merely off-screen when closed: a translated
          // drawer is still in the tab order, so a keyboard user would tab into
          // links they cannot see.
          mobileOpen ? 'translate-x-0 visible' : '-translate-x-full invisible'
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-muted-200 bg-white px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="size-6 text-primary" />
            <span className="font-heading text-lg font-bold text-secondary-800">
              E-Mart
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="-mr-2 rounded-lg p-2 text-muted-600 transition-colors hover:bg-muted-100"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
          {sidebarContent}
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        {/* Capped to the viewport so the menu scrolls inside a pinned panel.
            `sticky` alone cannot do this: it offsets an element of its own
            height, so a menu taller than the viewport still runs off the
            bottom and the links below the fold are only reachable by scrolling
            the whole page. */}
        <div className="sticky top-4 flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
            {sidebarContent}
          </div>
        </div>
      </aside>
    </>
  );
}
