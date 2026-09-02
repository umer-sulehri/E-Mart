'use client';

import Link from 'next/link';
import {
  HelpCircle,
  MessageSquare,
  Package,
  User,
  MapPin,
  ShoppingBag,
  Phone,
  Mail,
  ChevronRight,
} from 'lucide-react';

const helpSections = [
  {
    title: 'About Your Account',
    icon: User,
    links: [
      { label: 'How do I create an account?', href: '/register' },
      { label: 'How do I update my profile?', href: '/dashboard/profile' },
      { label: 'Manage my delivery addresses', href: '/dashboard/addresses' },
      { label: 'Change my password', href: '/dashboard/change-password' },
    ],
  },
  {
    title: 'Orders & Delivery',
    icon: Package,
    links: [
      { label: 'Track my order', href: '/dashboard/orders' },
      { label: 'Frequently asked questions', href: '/faq' },
      { label: 'Shopping cart and checkout', href: '/cart' },
      { label: 'My past orders', href: '/dashboard/orders' },
    ],
  },
  {
    title: 'Browsing & Products',
    icon: ShoppingBag,
    links: [
      { label: 'Browse all products', href: '/products' },
      { label: 'View product categories', href: '/categories' },
      { label: 'My wishlist', href: '/dashboard/wishlist' },
      { label: 'Search the store', href: '/search' },
    ],
  },
  {
    title: 'Need More Help?',
    icon: MessageSquare,
    links: [
      { label: 'Contact our support team', href: '/contact' },
      { label: 'Read our FAQ', href: '/faq' },
      { label: 'Visit our sellers directory', href: '/sellers' },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary">
          <HelpCircle className="h-8 w-8" />
        </div>
        <h1 className="font-heading text-4xl font-bold text-secondary-800">Help Center</h1>
        <p className="mx-auto mt-2 max-w-2xl text-muted-600">
          Find answers to common questions, manage your account, and get in touch with our
          support team.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {helpSections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-secondary-800">{section.title}</h2>
              </div>
              <ul className="divide-y divide-muted-100">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group flex items-center justify-between py-3 text-sm text-muted-600 hover:text-primary"
                    >
                      {link.label}
                      <ChevronRight className="h-4 w-4 text-muted-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-primary-50 p-8 text-center sm:flex-row sm:gap-8">
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 text-primary" />
          <div className="text-left">
            <p className="text-xs text-muted-500">Call us</p>
            <p className="text-sm font-medium text-secondary-800">+92 300 1234567</p>
          </div>
        </div>
        <div className="hidden h-8 w-px bg-primary/20 sm:block" />
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-primary" />
          <div className="text-left">
            <p className="text-xs text-muted-500">Email us</p>
            <p className="text-sm font-medium text-secondary-800">support@emart.pk</p>
          </div>
        </div>
        <div className="hidden h-8 w-px bg-primary/20 sm:block" />
        <MapPin className="h-5 w-5 text-primary" />
        <div className="text-left">
          <p className="text-xs text-muted-500">Store hours</p>
          <p className="text-sm font-medium text-secondary-800">Daily, 9am - 11pm</p>
        </div>
      </div>
    </div>
  );
}
