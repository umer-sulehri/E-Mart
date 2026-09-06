import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tag,
  Wallet,
  Star,
  Settings,
  Home,
} from 'lucide-react';

const suggestedLinks = [
  { label: 'Dashboard', href: '/seller', icon: LayoutDashboard },
  { label: 'Products', href: '/seller/products', icon: Package },
  { label: 'Orders', href: '/seller/orders', icon: ShoppingBag },
  { label: 'Coupons', href: '/seller/coupons', icon: Tag },
  { label: 'Earnings', href: '/seller/earnings', icon: Wallet },
  { label: 'Reviews', href: '/seller/reviews', icon: Star },
  { label: 'Profile', href: '/seller/profile', icon: Settings },
  { label: 'Storefront', href: '/', icon: Home },
];

export default function SellerNotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-8xl font-black text-primary/20 md:text-9xl">404</p>
      <h1 className="mt-4 font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
        Seller Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-sm text-secondary-600">
        This seller page doesn&apos;t exist or has been moved. Use one of the
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