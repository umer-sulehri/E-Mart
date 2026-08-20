'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import {
  HomeIcon, PackageIcon, OrderIcon, UserIcon, StarIcon, GearIcon,
  ChartIcon, UsersIcon, ClipboardListIcon, HeartIcon,
  MenuIcon, CloseIcon, PlusIcon,
} from '@/components/icons';

const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { label: 'Products', href: '/admin/products', icon: PackageIcon },
  { label: 'Orders', href: '/admin/orders', icon: OrderIcon },
  { label: 'Users', href: '/admin/users', icon: UsersIcon },
  { label: 'Sellers', href: '/admin/sellers', icon: UsersIcon },
  { label: 'Categories', href: '/admin/categories', icon: ClipboardListIcon },
  { label: 'Analytics', href: '/admin/analytics', icon: ChartIcon },
  { label: 'Settings', href: '/admin/settings', icon: GearIcon },
];

const SELLER_NAV = [
  { label: 'Dashboard', href: '/seller/dashboard', icon: HomeIcon },
  { label: 'My Products', href: '/seller/products', icon: PackageIcon },
  { label: 'Add Product', href: '/seller/products/new', icon: PlusIcon },
  { label: 'Reviews', href: '/seller/reviews', icon: StarIcon },
  { label: 'Profile', href: '/seller/profile', icon: UserIcon },
];

const BUYER_NAV = [
  { label: 'Dashboard', href: '/user/dashboard', icon: HomeIcon },
  { label: 'My Orders', href: '/user/orders', icon: OrderIcon },
  { label: 'Wishlist', href: '/wishlist', icon: HeartIcon },
  { label: 'Profile', href: '/user/profile', icon: UserIcon },
];

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { user, currentMode, logout } = useAuthStore();

  const navItems = user?.role === 'admin' ? ADMIN_NAV : currentMode === 'seller' ? SELLER_NAV : BUYER_NAV;

  return (
    <>
      {!collapsed && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onToggle} />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen pt-[72px] transition-all duration-300 ease-in-out ${collapsed ? 'w-[72px]' : 'w-[260px]'} max-lg:translate-x-0`}
        style={{ background: 'linear-gradient(180deg, var(--color-primary-dark) 0%, #0d0a08 50%, var(--color-primary-dark) 100%)', borderRight: '1px solid rgba(122,155,118,0.15)' }}
      >
        <div className="h-full overflow-y-auto px-3 py-4">
          {!collapsed && (
            <div className="flex items-center justify-between mb-6 px-3">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>E-Mart</span>
              </Link>
              <button onClick={onToggle} className="w-8 h-8 rounded-lg flex items-center justify-center lg:hidden" style={{ color: 'rgba(255,255,255,0.6)' }}>
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          <button onClick={onToggle} className="hidden lg:flex w-full items-center justify-center mb-4 py-2 rounded-xl transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <MenuIcon className="w-5 h-5" />
          </button>

          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
                    style={{
                      color: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.6)',
                      background: isActive ? 'rgba(122,155,118,0.12)' : 'transparent',
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => { logout(); window.location.href = '/'; }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              title={collapsed ? 'Logout' : undefined}
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
              </svg>
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
