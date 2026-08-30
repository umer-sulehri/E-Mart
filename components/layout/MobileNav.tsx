'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  {
    label: 'Beverages',
    icon: Wine,
    children: [
      { label: 'Water', href: '/products?category=beverages-water' },
      { label: 'Juice', href: '/products?category=beverages-juice' },
      { label: 'Soda', href: '/products?category=beverages-soda' },
      { label: 'Tea', href: '/products?category=beverages-tea' },
    ],
  },
  { label: 'Spices & Seasonings', icon: Flame, href: '/products?category=spices' },
  { label: 'Baby Food', icon: Baby, href: '/products?category=baby-food' },
  { label: 'Health & Wellness', icon: Heart, href: '/products?category=health' },
  { label: 'Household', icon: Home, href: '/products?category=household' },
  { label: 'Personal Care', icon: User, href: '/products?category=personal-care' },
  { label: 'Pet Food', icon: PawPrint, href: '/products?category=pet-food' },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNav({ open, onClose }: MobileNavProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

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
        className={cn(
          'fixed top-0 left-0 z-[121] h-full w-[300px] max-w-[85vw] bg-white shadow-xl transition-transform duration-300 ease-in-out overflow-y-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-muted-200">
          <h2 className="text-lg font-bold text-secondary">E-Mart Menu</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-lg hover:bg-muted-100 hover:text-primary transition-colors"
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
                { label: 'My Account', href: '/account' },
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
