import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Youtube, Instagram } from 'lucide-react';

const organicLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Shop', href: '/shop' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

const quickLinks = [
  { label: 'Categories', href: '/shop' },
  { label: 'New Arrivals', href: '/shop?sort=newest' },
  { label: 'Best Sellers', href: '/shop?sort=bestselling' },
  { label: 'Sale', href: '/shop?sale=true' },
];

const customerServiceLinks = [
  { label: 'My Account', href: '/account' },
  { label: 'Order Tracking', href: '/account/orders' },
  { label: 'Returns', href: '/returns' },
  { label: 'FAQ', href: '/faq' },
];

const socialLinks = [
  { label: 'Facebook', icon: Facebook, href: '#' },
  { label: 'Twitter', icon: Twitter, href: '#' },
  { label: 'YouTube', icon: Youtube, href: '#' },
  { label: 'Instagram', icon: Instagram, href: '#' },
];

export default function Footer() {
  return (
    <footer className="bg-secondary text-white pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          <div>
            <Link href="/" className="inline-block" aria-label="E-Mart home">
              <Image
                src="/images/logo.svg"
                alt="E-Mart logo"
                width={200}
                height={56}
                className="h-auto w-auto brightness-0 invert"
              />
            </Link>
            <div className="flex items-center gap-2 mt-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="flex h-9 w-9 items-center justify-center rounded border border-white/30 text-white hover:bg-white hover:text-secondary transition-colors"
                    aria-label={social.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h5 className="text-lg font-bold mb-4">Organic</h5>
            <ul className="space-y-2">
              {organicLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-lg font-bold mb-4">Quick Links</h5>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-lg font-bold mb-4">Customer Service</h5>
            <ul className="space-y-2">
              {customerServiceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="max-w-xl mx-auto text-center">
            <h5 className="text-lg font-bold mb-2">Subscribe Us</h5>
            <p className="text-white/70 text-sm mb-4">
              Subscribe to our newsletter to get updates about our grand offers.
            </p>
            <form
              className="flex"
              onSubmit={(e) => e.preventDefault()}
              aria-label="Newsletter signup"
            >
              <input
                type="email"
                placeholder="Email Address"
                className="flex-1 rounded-l bg-white/10 border border-white/20 px-4 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/40"
                aria-label="Email Address"
              />
              <button
                type="submit"
                className="rounded-r bg-secondary-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-secondary-800/80 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 mt-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-white/60">
            <p>&copy; 2024 E-Mart. All rights reserved. Design by TemplatesJungle</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
