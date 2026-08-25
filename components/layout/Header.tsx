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
  ChevronDown,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import MobileNav from './MobileNav';

const pageLinks = [
  { label: 'About', href: '/about' },
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
      router.push(`/products?q=${encodeURIComponent(q)}`);
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
  const [pagesOpen, setPagesOpen] = useState(false);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemCount = useCartStore((s) => s.itemCount());

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
