'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  Star,
  Tag,
  User,
  LogOut,
  Menu,
  X,
  Leaf,
  Store,
  Info,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Seller Dashboard', href: '/seller', icon: LayoutDashboard },
  { label: 'Products', href: '/seller/products', icon: Package },
  { label: 'Orders', href: '/seller/orders', icon: ShoppingCart },
  { label: 'Earnings', href: '/seller/earnings', icon: DollarSign },
  { label: 'Reviews', href: '/seller/reviews', icon: Star },
  { label: 'Coupons', href: '/seller/coupons', icon: Tag },
  { label: 'Profile Settings', href: '/seller/profile', icon: User },
];

export default function SellerSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'S';

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-muted-200 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-secondary-800">
            {user ? `${user.firstName} ${user.lastName}` : 'Seller'}
          </p>
          <p className="truncate text-xs text-muted-500">
            {user?.email ?? 'seller@example.com'}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navLinks.map((link) => {
          const isActive =
            link.href === '/seller'
              ? pathname === '/seller'
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

      {/* Become a Seller banner */}
      <div className="mx-4 mb-4 rounded-lg border border-primary-200 bg-primary-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-semibold text-primary-700">
              Seller Tips
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-primary-600">
              Keep your store updated with accurate stock and fast shipping to
              earn top seller badges.
            </p>
          </div>
        </div>
      </div>

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
