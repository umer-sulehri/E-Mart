'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Facebook, Twitter, Youtube, Instagram, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const organicLinks = [
  { label: 'About us', href: '/about' },
  { label: 'Conditions', href: '/terms' },
  { label: 'Our Journals', href: '/blog' },
  { label: 'Careers', href: '/about' },
  { label: 'Affiliate Programme', href: '/about' },
  { label: 'Ultras Press', href: '/about' },
];

const quickLinks = [
  { label: 'Offers', href: '/products?sale=true' },
  { label: 'Discount Coupons', href: '/products' },
  { label: 'Stores', href: '/sellers' },
  { label: 'Track Order', href: '/dashboard/orders' },
  { label: 'Shop', href: '/products' },
  { label: 'Info', href: '/about' },
];

const customerServiceLinks = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Returns & Refunds', href: '/faq' },
  { label: 'Cookie Guidelines', href: '/privacy-policy' },
  { label: 'Delivery Information', href: '/faq' },
];

const fallbackSocialLinks = [
  { label: 'Facebook', icon: Facebook, href: '#' },
  { label: 'Twitter', icon: Twitter, href: '#' },
  { label: 'YouTube', icon: Youtube, href: '#' },
  { label: 'Instagram', icon: Instagram, href: '#' },
];

const platformIconMap: Record<string, React.ElementType> = {
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
  instagram: Instagram,
  whatsapp: MessageCircle,
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLinksData, setSocialLinksData] = useState<{ platform: string; url: string; icon?: string }[]>([]);

  useEffect(() => {
    fetch('/api/v1/social-links')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setSocialLinksData(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const displaySocialLinks = socialLinksData.length > 0
    ? socialLinksData.map((link) => ({
        label: link.platform,
        icon: platformIconMap[link.platform.toLowerCase()] || Facebook,
        href: link.url,
      }))
    : fallbackSocialLinks;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/v1/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Subscription failed');
      }

      toast.success('Thanks for subscribing!');
      setEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="py-5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">

          {/* Column 1: Logo + Social */}
          <div className="col-span-1 lg:col-span-2">
            <Link href="/" className="inline-block" aria-label="E-Mart home">
              <Image
                src="/images/logo.svg"
                alt="E-Mart logo"
                width={240}
                height={70}
                className="h-auto w-auto"
              />
            </Link>
            <div className="social-links mt-3 flex items-center gap-2">
              {displaySocialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="flex h-9 w-9 items-center justify-center rounded border border-[#EFEFEF] text-muted hover:bg-[#EFEFEF] hover:text-dark transition-colors"
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

          {/* Column 2: Organic */}
          <div>
            <h5 className="widget-title text-lg font-bold mb-4">Organic</h5>
            <ul className="menu-list list-none space-y-2">
              {organicLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="nav-link text-muted hover:text-dark transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h5 className="widget-title text-lg font-bold mb-4">Quick Links</h5>
            <ul className="menu-list list-none space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="nav-link text-muted hover:text-dark transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Customer Service */}
          <div>
            <h5 className="widget-title text-lg font-bold mb-4">Customer Service</h5>
            <ul className="menu-list list-none space-y-2">
              {customerServiceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="nav-link text-muted hover:text-dark transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-muted-200">
          <div className="max-w-md">
            <h5 className="widget-title text-lg font-bold mb-2">Subscribe Us</h5>
            <p className="text-muted text-sm mb-3">
              Subscribe to our newsletter to get updates about our grand offers.
            </p>
            <form
              className="flex gap-0"
              onSubmit={handleSubscribe}
              aria-label="Newsletter signup"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="flex-1 rounded-l-none border border-muted-200 bg-muted-50 px-4 py-2.5 text-sm text-dark placeholder:text-muted focus:outline-none focus:border-primary"
                aria-label="Email Address"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-r-none bg-dark px-6 py-2.5 text-sm font-medium text-white hover:bg-secondary-800 transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div id="footer-bottom" className="border-t border-muted-200 mt-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-muted">
            <div className="copyright">
              &copy; 2024 E-Mart. All rights reserved.
            </div>
            <div className="credit-link text-start md:text-end">
              HTML Template by <a href="https://templatesjungle.com/" className="hover:text-dark">TemplatesJungle</a> Distributed By <a href="https://themewagon.com" className="hover:text-dark">ThemeWagon</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
