import Link from 'next/link';
import { Home, ShoppingCart, BookOpen, Tag, Phone } from 'lucide-react';

const suggestedLinks = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Products', href: '/products', icon: ShoppingCart },
  { label: 'Blog', href: '/blog', icon: BookOpen },
  { label: 'Categories', href: '/categories', icon: Tag },
  { label: 'Contact Us', href: '/contact', icon: Phone },
];

export default function NotFound() {
  return (
    <section className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-8xl font-black text-primary/20 md:text-9xl">404</p>
      <h1 className="mt-4 font-heading text-2xl font-bold text-secondary-800 md:text-3xl">
        Page Not Found
      </h1>
      <p className="mt-3 max-w-md text-sm text-secondary-600">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back on track.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-500"
      >
        Back to Home
      </Link>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        {suggestedLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              href={link.href}
              className="inline-flex items-center gap-2 rounded-full border border-muted-200 px-5 py-2.5 text-sm font-medium text-secondary-700 transition-colors hover:border-primary hover:text-primary"
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
