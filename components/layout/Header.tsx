'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  User,
  Heart,
  ShoppingBag,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import MobileNav from './MobileNav';
import NotificationBell from '@/components/ui/NotificationBell';

const pageLinks = [
  { label: 'About', href: '/about' },
  { label: 'Sellers', href: '/sellers' },
  { label: 'Shop', href: '/products' },
  { label: 'Cart', href: '/cart' },
  { label: 'Checkout', href: '/checkout' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
  { label: 'My Account', href: '/account' },
];

interface Suggestion {
  text: string;
  type: 'category' | 'brand' | 'product';
  slug: string;
  imageUrl?: string;
  price?: number;
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/v1/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success) {
          setSuggestions(json.data || []);
          setOpen((json.data || []).length > 0);
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateTo = useCallback(
    (q: string) => {
      setOpen(false);
      setQuery('');
      router.push(`/search?q=${encodeURIComponent(q)}`);
    },
    [router]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Save search history (fire-and-forget)
      fetch('/api/v1/search/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      }).catch(() => {});
      navigateTo(query.trim());
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'category': return '📂';
      case 'brand': return '🏷️';
      default: return '🛒';
    }
  };

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <form
        className="flex flex-1 items-center"
        onSubmit={handleSubmit}
        role="search"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length < 2) setOpen(false);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          placeholder="Search for more than 20,000 products"
          className="flex-1 bg-transparent border-0 text-sm text-secondary placeholder:text-muted focus:outline-none px-3 py-1"
          aria-label="Search products"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setOpen(false);
            }}
            className="p-1 text-muted hover:text-secondary transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          className="p-2 text-muted hover:text-secondary transition-colors"
          aria-label="Search"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-muted-200 bg-white shadow-lg max-h-80 overflow-y-auto">
          {suggestions.slice(0, 8).map((s, i) => (
            <button
              key={`${s.type}-${s.slug}-${i}`}
              onClick={() => navigateTo(s.text)}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-muted-50 transition-colors border-b border-muted-50 last:border-b-0"
            >
              <span className="text-base">{typeIcon(s.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-secondary-800 font-medium">{s.text}</p>
                <p className="text-xs text-muted-500 capitalize">{s.type}</p>
              </div>
              {s.price != null && (
                <span className="text-xs font-semibold text-primary whitespace-nowrap">
                  Rs. {s.price.toLocaleString()}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => navigateTo(query.trim())}
            className="w-full px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-muted-50 transition-colors"
          >
            View all results for &quot;{query}&quot;
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const itemCount = useCartStore((s) => s.itemCount());
  const navButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetch('/api/v1/categories')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data.map((c: { name: string; slug: string }) => ({ name: c.name, slug: c.slug })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileNavOpen) {
        setMobileNavOpen(false);
        navButtonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="container-fluid px-4 sm:px-6 lg:px-12">
          <div className="flex flex-wrap items-center justify-between py-3 gap-4">

            <div className="flex items-center gap-2">
              <button
                ref={navButtonRef}
                className="p-2 -ml-2 rounded-lg text-secondary hover:bg-muted-100 hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={mobileNavOpen}
                aria-haspopup="dialog"
              >
                <Menu className="h-6 w-6" />
              </button>
              <Link href="/" className="flex-shrink-0" aria-label="E-Mart Home">
                <Image
                  src="/images/logo.svg"
                  alt="E-Mart logo"
                  width={160}
                  height={48}
                  className="h-auto w-auto"
                  priority
                />
              </Link>
            </div>

            <div className="order-last lg:order-none w-full lg:w-auto flex-1 max-w-xl mx-auto hidden sm:block">
              <div className="flex items-center bg-muted-50 rounded-2xl p-2 border border-muted-200 focus-within:border-primary">
                <div className="hidden md:block border-r border-muted-300 pr-2">
                  <select
                    className="bg-transparent border-0 text-sm text-secondary focus:outline-none cursor-pointer py-1 px-2"
                    aria-label="Select category"
                    onChange={(e) => {
                      if (e.target.value) {
                        window.location.href = `/products?category=${e.target.value}`;
                      }
                    }}
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <SearchBar className="flex-1" />
              </div>
            </div>

            <nav
              className="hidden lg:flex items-center gap-6 text-sm font-bold uppercase text-dark"
              aria-label="Main navigation"
            >
              {pageLinks.slice(0, 5).map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="py-2 hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <ul className="flex items-center gap-5 justify-end m-0 list-none">
              <li>
                <NotificationBell />
              </li>
              <li>
                <Link
                  href="/account"
                  className="p-2 hover:text-primary transition-colors"
                  aria-label="My Account"
                >
                  <User className="h-6 w-6" />
                </Link>
              </li>
              <li>
                <Link
                  href="/wishlist"
                  className="p-2 hover:text-primary transition-colors"
                  aria-label="Wishlist"
                >
                  <Heart className="h-6 w-6" />
                </Link>
              </li>
              <li>
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
              </li>
            </ul>

            <div className="w-full lg:hidden">
              <div className="flex items-center bg-muted-50 rounded-2xl p-2 border border-muted-200 focus-within:border-primary">
                <SearchBar className="flex-1" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}
