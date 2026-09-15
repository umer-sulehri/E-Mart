'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const MobileBottomNav = () => {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.uniqueItemCount());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const links = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
      active: isActive('/') && !pathname.startsWith('/products') && !pathname.startsWith('/search'),
    },
    {
      href: '/search',
      label: 'Search',
      icon: Search,
      active: isActive('/search'),
    },
    {
      href: '/cart',
      label: 'Cart',
      icon: ShoppingCart,
      badge: itemCount,
      active: isActive('/cart') || isActive('/checkout'),
    },
    {
      href: isAuthenticated ? '/dashboard' : '/login',
      label: 'Account',
      icon: User,
      active: isActive('/dashboard') || pathname === '/login',
    },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-muted-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            aria-label={link.label}
            aria-current={link.active ? 'page' : undefined}
            className={cn(
              'relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-1.5 transition-colors active:bg-muted-50',
              link.active ? 'text-primary' : 'text-muted-500 hover:text-secondary-700'
            )}
          >
            <span className="relative">
              <link.icon size={22} strokeWidth={link.active ? 2.2 : 1.8} />
              {typeof link.badge === 'number' && link.badge > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white">
                  {link.badge > 99 ? '99+' : link.badge}
                </span>
              )}
            </span>
            <span
              className={cn(
                'text-[11px] font-medium',
                link.active ? 'text-primary' : 'text-muted-500'
              )}
            >
              {link.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;