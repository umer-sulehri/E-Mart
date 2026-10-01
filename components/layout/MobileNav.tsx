'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBodyScrollLock, useEscapeKey } from '@/hooks/useOverlay';
import { PAGES_LINKS } from '@/lib/constants';
import {
  X,
  Apple,
  Egg,
  Beef,
  Fish,
  Croissant,
  Package,
  Snowflake,
  Utensils,
  Coffee,
  Cookie,
  Wine,
  Flame,
  Baby,
  Heart,
  Home,
  User,
  PawPrint,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: { label: string; href: string }[];
}

const categories: Category[] = [
  { label: 'Fruits & Vegetables', icon: Apple, href: '/products?category=fruits-vegetables' },
  { label: 'Dairy & Eggs', icon: Egg, href: '/products?category=dairy-eggs' },
  { label: 'Meat & Poultry', icon: Beef, href: '/products?category=meat-poultry' },
  { label: 'Seafood', icon: Fish, href: '/products?category=seafood' },
  { label: 'Bakery', icon: Croissant, href: '/products?category=bakery' },
  { label: 'Canned Goods', icon: Package, href: '/products?category=canned-goods' },
  { label: 'Frozen Foods', icon: Snowflake, href: '/products?category=frozen-foods' },
  { label: 'Pasta & Rice', icon: Utensils, href: '/products?category=pasta-rice' },
  { label: 'Breakfast', icon: Coffee, href: '/products?category=breakfast' },
  { label: 'Snacks', icon: Cookie, href: '/products?category=snacks' },
  { label: 'Beverages', icon: Wine, href: '/products?category=beverages' },
  { label: 'Spices & Seasonings', icon: Flame, href: '/products?category=spices-seasonings' },
  { label: 'Baby Food & Formula', icon: Baby, href: '/products?category=baby-food-formula' },
  { label: 'Health & Wellness', icon: Heart, href: '/products?category=health-wellness' },
  { label: 'Household Supplies', icon: Home, href: '/products?category=household-supplies' },
  { label: 'Personal Care', icon: User, href: '/products?category=personal-care' },
  { label: 'Pet Food & Supplies', icon: PawPrint, href: '/products?category=pet-food-supplies' },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNav({ open, onClose }: MobileNavProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Reference-counted: the cart drawer can be opened from inside this menu, and
  // a plain body.overflow reset on unmount would re-enable scrolling behind it.
  useBodyScrollLock(open);
  useEscapeKey(open, onClose);

  // A new sheet should start collapsed rather than inheriting the last
  // category the user drilled into.
  useEffect(() => {
    if (open) setExpanded(null);
  }, [open]);

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[120] bg-black/50 transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <nav
        role="navigation"
        aria-label="Mobile navigation"
        aria-hidden={!open}
        className={cn(
          // Not a flex container, so `overflow-y-auto` here is a reliable
          // scroll container: the menu is far taller than any phone viewport
          // and the sticky header stays pinned while the links scroll beneath
          // it. Bottom padding clears the home indicator on the last category.
          'fixed top-0 left-0 z-[121] h-full w-[300px] max-w-[85vw] overflow-y-auto overscroll-contain bg-white pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-xl transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full invisible'
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-muted-200 bg-white p-4">
          <h2 className="text-lg font-bold text-secondary">E-Mart Menu</h2>
          <button
            onClick={onClose}
            className="-mr-2 rounded-lg p-2.5 text-muted transition-colors hover:bg-muted-100 hover:text-primary"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-muted-200">
          <p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Quick Links</p>
          <ul>
            {(
              [
                { label: 'Shop', href: '/products' },
                { label: 'Cart', href: '/cart' },
                { label: 'Wishlist', href: '/wishlist' },
                { label: 'My Account', href: '/dashboard' },
              ] as const
            ).map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="block py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* The header nav is hidden below `md`, so without this section the
            drawer - the mobile nav - was missing About, Blog, Contact,
            Compare and Help entirely. Rendered from the shared list so the two
            cannot drift apart again. */}
        <div className="px-4 py-3 border-b border-muted-200">
          <p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Pages</p>
          <ul className="grid grid-cols-2 gap-x-4">
            {PAGES_LINKS.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="block py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-4 pt-4 pb-1">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Shop by Category</p>
        </div>

        <ul className="p-4 pt-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const hasChildren = !!cat.children?.length;
            const isExpanded = expanded === cat.label;

            return (
              <li key={cat.label} className="border-dashed-bottom last:border-b-0">
                <div className="flex items-center">
                  {hasChildren ? (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : cat.label)}
                      className="flex flex-1 items-center gap-3 py-3 text-left text-sm font-medium text-secondary hover:text-primary transition-colors"
                      aria-expanded={isExpanded}
                    >
                      <Icon className="h-5 w-5 text-muted" />
                      <span className="flex-1">{cat.label}</span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-muted transition-transform duration-200',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </button>
                  ) : (
                    <Link
                      href={cat.href!}
                      onClick={onClose}
                      className="flex flex-1 items-center gap-3 py-3 text-sm font-medium text-secondary hover:text-primary transition-colors"
                    >
                      <Icon className="h-5 w-5 text-muted" />
                      <span>{cat.label}</span>
                    </Link>
                  )}
                </div>

                {hasChildren && (
                  <ul
                    className={cn(
                      'overflow-hidden transition-all duration-300',
                      isExpanded ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    {cat.children!.map((child) => (
                      <li key={child.label}>
                        <Link
                          href={child.href}
                          onClick={onClose}
                          className="flex items-center gap-3 py-2 pl-12 pr-3 text-sm text-muted hover:text-primary transition-colors"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
