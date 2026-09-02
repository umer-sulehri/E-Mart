'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  Grid,
  Tag,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ImageIcon,
  Newspaper,
  ScrollText,
  User,
  BadgePercent,
  Building2,
  Mail,
  Activity,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const navLinks = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Sellers', href: '/admin/sellers', icon: Store },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Offers', href: '/admin/offers', icon: BadgePercent },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Categories', href: '/admin/categories', icon: Grid },
  { label: 'Coupons', href: '/admin/coupons', icon: Tag },
  { label: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
  { label: 'Banners', href: '/admin/banners', icon: ImageIcon },
  { label: 'Blog', href: '/admin/blog', icon: Newspaper },
  { label: 'Stores / Brands', href: '/admin/stores', icon: Building2 },
  { label: 'Contact', href: '/admin/contact', icon: Mail },
  { label: 'Analytics', href: '/admin/analytics', icon: Activity },
  { label: 'Logs', href: '/admin/logs', icon: ScrollText },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Social Links', href: '/admin/social-links', icon: Link2 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'My Account', href: '/admin/account', icon: User },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {}
    logout();
    setMobileOpen(false);
    router.push('/login');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-muted-200 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-lg font-bold text-white">
          <Shield className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-secondary-800">
              Admin Panel
            </p>
            <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-700">
              ADMIN
            </span>
          </div>
          <p className="truncate text-xs text-muted-500">emart.pk</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                active
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
        <Link
          href="/"
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-600 transition-colors hover:bg-muted-50 hover:text-secondary-800"
        >
          <LayoutDashboard className="h-5 w-5" />
          Back to Store
        </Link>
        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-50"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md lg:hidden"
      >
        <Menu className="h-5 w-5 text-secondary-800" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transition-transform lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-muted-200 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-heading text-lg font-bold text-secondary-800">
              E-Mart Admin
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

      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-4 rounded-xl bg-white shadow-sm">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
