import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Star,
  Settings,
  Home,
} from 'lucide-react';

const suggestedLinks = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Coupons', href: '/admin/coupons', icon: Tag },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Storefront', href: '/', icon: Home },
];

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-8xl font-black text-primary/20 md:text-9xl">404</p>
      <h1 className="mt-4 font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
        Admin Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-sm text-secondary-600">
        This admin module doesn&apos;t exist or has been moved. Use one of the
        sections below to keep working.
      </p>

      <div className="mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
        {suggestedLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex flex-col items-center gap-2 rounded-lg border border-muted-200 bg-white px-4 py-4 text-sm font-medium text-secondary-700 transition-colors hover:border-primary hover:bg-primary-50 hover:text-primary"
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}