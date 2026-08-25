'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Orders', href: '/dashboard/orders', icon: Package },
  { label: 'Wishlist', href: '/dashboard/wishlist', icon: Heart },
  { label: 'My Addresses', href: '/dashboard/addresses', icon: MapPin },
  { label: 'Profile Settings', href: '/dashboard/profile', icon: User },
  { label: 'Change Password', href: '/dashboard/change-password', icon: Lock },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U';

  const sidebarContent = (
    <div className="flex h-full flex-col">
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
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-l-[3px] border-primary bg-primary-50 text-primary-600'
                  : 'text-muted-600 hover:bg-muted-50 hover:text-secondary-800'
              )}
            >
              <link.icon className="h-5 w-5 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-muted-200 p-4">
        <button
          onClick={() => {
            logout();
            setMobileOpen(false);
          }}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-50"
        >
          <LogOut className="h-5 w-5" />
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
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md lg:hidden"
      >
        <Menu className="h-5 w-5 text-secondary-800" />
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
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transition-transform lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-muted-200 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-heading text-lg font-bold text-secondary-800">
              E-Mart
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 hover:bg-muted-100"
          >
            <X className="h-5 w-5 text-muted-600" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-4 rounded-xl bg-white shadow-sm">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
