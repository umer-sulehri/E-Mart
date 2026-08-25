'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu,
  Search,
  User,
  Heart,
  ShoppingBag,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import MobileNav from './MobileNav';

const pageLinks = [
  { label: 'About', href: '/about' },
  { label: 'Shop', href: '/shop' },
  { label: 'Single Product', href: '/shop/product-slug' },
  { label: 'Cart', href: '/cart' },
  { label: 'Checkout', href: '/checkout' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
  { label: 'My Account', href: '/account' },
];

export default function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemCount = useCartStore((s) => s.itemCount());

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPagesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header>
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-wrap items-center justify-between py-3 border-b border-muted-200 gap-4">

            <div className="flex items-center gap-3">
              <Link href="/" className="flex-shrink-0" aria-label="Home">
                <Image
                  src="/images/logo.svg"
                  alt="E-Mart logo"
                  width={160}
                  height={48}
                  className="h-auto w-auto"
                  priority
                />
              </Link>
              <button
                className="lg:hidden p-2 -ml-2"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu className="h-6 w-6 text-secondary" />
              </button>
            </div>

            <div className="order-last lg:order-none w-full lg:w-auto flex-1 max-w-xl mx-auto hidden sm:block">
              <div className="flex items-center bg-muted-50 rounded-full p-2">
                <div className="hidden md:block border-r border-muted-300 pr-2">
                  <select
                    className="bg-transparent border-0 text-sm text-secondary focus:outline-none cursor-pointer py-1 px-2"
                    aria-label="Select category"
                  >
                    <option>All Categories</option>
                    <option>Groceries</option>
                    <option>Drinks</option>
                    <option>Chocolates</option>
                  </select>
                </div>
                <form
                  className="flex flex-1 items-center"
                  onSubmit={(e) => e.preventDefault()}
                  role="search"
                >
                  <input
                    type="text"
                    placeholder="Search for more than 20,000 products"
                    className="flex-1 bg-transparent border-0 text-sm text-secondary placeholder:text-muted focus:outline-none px-3 py-1"
                    aria-label="Search products"
                  />
                  <button
                    type="submit"
                    className="p-2 text-muted hover:text-secondary transition-colors"
                    aria-label="Search"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </div>

            <nav
              className="hidden lg:flex items-center gap-5 xl:gap-8 text-sm font-bold uppercase tracking-wider text-secondary"
              aria-label="Main navigation"
            >
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center gap-1 hover:text-primary transition-colors py-2"
                  onClick={() => setPagesOpen((o) => !o)}
                  aria-expanded={pagesOpen}
                  aria-haspopup="true"
                >
                  Pages
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      pagesOpen && 'rotate-180'
                    )}
                  />
                </button>
                {pagesOpen && (
                  <ul className="absolute top-full left-0 mt-1 bg-white border-0 shadow-lg rounded-none p-3 min-w-[200px] z-50 animate-slide-up">
                    {pageLinks.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="block py-2 px-3 text-sm font-normal text-secondary hover:bg-muted-50 hover:text-primary transition-colors rounded"
                          onClick={() => setPagesOpen(false)}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </nav>

            <div className="flex items-center gap-3 sm:gap-5 justify-end">
              <Link
                href="/account"
                className="p-2 hover:text-primary transition-colors"
                aria-label="My Account"
              >
                <User className="h-6 w-6" />
              </Link>
              <Link
                href="/wishlist"
                className="p-2 hover:text-primary transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="h-6 w-6" />
              </Link>
              <button
                className="p-2 hover:text-primary transition-colors relative"
                aria-label={`Shopping bag, ${itemCount} items`}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('toggle-cart'));
                }}
              >
                <ShoppingBag className="h-6 w-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </button>
            </div>

            <div className="w-full sm:hidden">
              <div className="flex items-center bg-muted-50 rounded-full p-2">
                <form
                  className="flex flex-1 items-center"
                  onSubmit={(e) => e.preventDefault()}
                  role="search"
                >
                  <input
                    type="text"
                    placeholder="Search for more than 20,000 products"
                    className="flex-1 bg-transparent border-0 text-sm text-secondary placeholder:text-muted focus:outline-none px-3 py-1"
                    aria-label="Search products"
                  />
                  <button
                    type="submit"
                    className="p-2 text-muted hover:text-secondary transition-colors"
                    aria-label="Search"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}
