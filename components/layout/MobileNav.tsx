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
  { label: 'Fruits & Vegetables', icon: Apple, href: '/shop?category=fruits-vegetables' },
  { label: 'Dairy & Eggs', icon: Egg, href: '/shop?category=dairy-eggs' },
  { label: 'Meat & Poultry', icon: Beef, href: '/shop?category=meat-poultry' },
  { label: 'Seafood', icon: Fish, href: '/shop?category=seafood' },
  { label: 'Bakery', icon: Croissant, href: '/shop?category=bakery' },
  { label: 'Canned Goods', icon: Package, href: '/shop?category=canned-goods' },
  { label: 'Frozen Foods', icon: Snowflake, href: '/shop?category=frozen-foods' },
  { label: 'Pasta & Rice', icon: Utensils, href: '/shop?category=pasta-rice' },
  { label: 'Breakfast', icon: Coffee, href: '/shop?category=breakfast' },
  { label: 'Snacks', icon: Cookie, href: '/shop?category=snacks' },
  {
    label: 'Beverages',
    icon: Wine,
    children: [
      { label: 'Water', href: '/shop?category=beverages-water' },
      { label: 'Juice', href: '/shop?category=beverages-juice' },
      { label: 'Soda', href: '/shop?category=beverages-soda' },
      { label: 'Tea', href: '/shop?category=beverages-tea' },
    ],
  },
  { label: 'Spices & Seasonings', icon: Flame, href: '/shop?category=spices' },
  { label: 'Baby Food', icon: Baby, href: '/shop?category=baby-food' },
  { label: 'Health & Wellness', icon: Heart, href: '/shop?category=health' },
  { label: 'Household', icon: Home, href: '/shop?category=household' },
  { label: 'Personal Care', icon: User, href: '/shop?category=personal-care' },
  { label: 'Pet Food', icon: PawPrint, href: '/shop?category=pet-food' },
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
          <h2 className="text-lg font-bold text-secondary">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 hover:text-primary transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <ul className="p-4">
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
