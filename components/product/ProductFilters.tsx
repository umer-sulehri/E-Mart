'use client';

import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { CloseIcon, FilterIcon } from '@/components/icons';
import { IconButton } from '@/components/ui/Icon';

interface ProductFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  categories: string[];
  priceRange: [number, number];
  minRating: number;
}

const defaultFilters: FilterState = {
  categories: [],
  priceRange: [0, 5000],
  minRating: 0,
};

function AccordionSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between h-[48px] px-4 text-sm font-semibold text-text-primary hover:bg-bg transition-colors"
        aria-expanded={open}
      >
        {title}
        <span className={`transform transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function ProductFilters({ onFilterChange }: ProductFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const { data: categories = [], isLoading } = useCategories();

  const updateFilters = (partial: Partial<FilterState>) => {
    const next = { ...filters, ...partial };
    setFilters(next);
    onFilterChange(next);
  };

  const toggleCategory = (categoryId: string) => {
    const current = filters.categories;
    const next = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId];
    updateFilters({ categories: next });
  };

  const filterContent = (
    <div className="divide-y divide-border">
      <AccordionSection title="Categories">
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 bg-surface-alt rounded animate-pulse" />
              ))}
            </div>
          ) : (
            categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-3 h-[40px] cursor-pointer text-sm text-text-primary"
              >
                <input
                  type="checkbox"
                  checked={filters.categories.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary accent-primary"
                />
                <span>{cat.name}</span>
              </label>
            ))
          )}
        </div>
      </AccordionSection>

      <AccordionSection title="Price Range">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={filters.priceRange[0]}
              onChange={(e) => updateFilters({ priceRange: [Number(e.target.value), filters.priceRange[1]] })}
              className="w-full h-[40px] px-3 bg-bg border border-border rounded-[10px] text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              min={0}
              aria-label="Minimum price"
            />
            <span className="text-text-secondary">–</span>
            <input
              type="number"
              value={filters.priceRange[1]}
              onChange={(e) => updateFilters({ priceRange: [filters.priceRange[0], Number(e.target.value)] })}
              className="w-full h-[40px] px-3 bg-bg border border-border rounded-[10px] text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              min={0}
              aria-label="Maximum price"
            />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="Minimum Rating">
        <div className="flex flex-col gap-2">
          {[4, 3, 2, 1].map((rating) => (
            <label
              key={rating}
              className="flex items-center gap-2 h-[40px] cursor-pointer text-sm text-text-primary"
            >
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === rating}
                onChange={() => updateFilters({ minRating: rating })}
                className="w-5 h-5 accent-primary"
              />
              <span>{rating}+ stars</span>
            </label>
          ))}
          <button
            onClick={() => updateFilters({ minRating: 0 })}
            className="text-xs text-primary-dark hover:underline h-[40px] flex items-center"
          >
            Clear rating
          </button>
        </div>
      </AccordionSection>
    </div>
  );

  return (
    <>
      <IconButton
        label="Open filters"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden"
      >
        <FilterIcon className="w-6 h-6" />
      </IconButton>

      <div className="hidden lg:block">
        <div className="bg-surface rounded-[16px] border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-base font-semibold text-text-primary">Filters</h3>
            <button
              onClick={() => {
                setFilters(defaultFilters);
                onFilterChange(defaultFilters);
              }}
              className="text-xs text-primary-dark hover:underline min-h-[48px] min-w-[48px] inline-flex items-center justify-center"
            >
              Reset
            </button>
          </div>
          {filterContent}
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[300px] max-w-[85vw] bg-bg shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-base font-semibold text-text-primary">Filters</h3>
              <IconButton label="Close filters" onClick={() => setMobileOpen(false)}>
                <CloseIcon className="w-5 h-5" />
              </IconButton>
            </div>
            {filterContent}
            <div className="sticky bottom-0 bg-bg border-t border-border p-4">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-full h-[48px] bg-primary text-text-inverse rounded-[12px] font-semibold hover:bg-primary-dark transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
