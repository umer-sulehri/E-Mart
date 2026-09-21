'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Star, Sparkles, X, RotateCcw } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { tryParseJson } from '@/lib/api';
import BrandFilter from '@/components/product/BrandFilter';
import AvailabilityToggle from '@/components/ui/AvailabilityToggle';
import PriceRangeSlider from '@/components/ui/PriceRangeSlider';
import {
  EMPTY_FILTERS,
  activeFilterCount,
  type FilterState,
} from '@/lib/filterParams';

export type { FilterState };
export { EMPTY_FILTERS };

interface CategoryOption {
  slug: string;
  name: string;
  depth: number;
}

interface ApiCategory {
  name: string;
  slug: string;
  subcategories?: ApiCategory[];
}

function flattenCategories(
  categories: ApiCategory[],
  depth = 0
): CategoryOption[] {
  const out: CategoryOption[] = [];
  for (const c of categories) {
    out.push({ slug: c.slug, name: c.name, depth });
    if (c.subcategories?.length) {
      out.push(...flattenCategories(c.subcategories, depth + 1));
    }
  }
  return out;
}

interface ProductFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  priceBounds?: { min: number; max: number };
}

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-muted-100 py-4 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-sm font-semibold text-secondary-800"
      >
        {title}
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}

export default function ProductFilters({
  filters,
  onFilterChange,
  priceBounds,
}: ProductFiltersProps) {
  // Live category list from the DB, falling back to the static catalog while
  // loading or when the request fails.
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(() =>
    flattenCategories(CATEGORIES as unknown as ApiCategory[])
  );

  useEffect(() => {
    fetch('/api/v1/categories')
      .then((res) => tryParseJson<{ success: boolean; data?: ApiCategory[] }>(res))
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          setCategoryOptions(flattenCategories(json.data));
        }
      })
      .catch(() => {});
  }, []);

  // Default bounds when the caller hasn't resolved real product prices yet.
  const boundsMin = priceBounds?.min ?? 0;
  const boundsMax = priceBounds?.max ?? 100000;

  // Price keeps a local "live" value so the slider tracks the pointer during
  // a drag, while the committed filter is debounced (300ms) into the URL.
  const [price, setPrice] = useState<[number, number]>(() => {
    const min = Number(filters.minPrice) || boundsMin;
    const max = Number(filters.maxPrice) || boundsMax;
    return [Math.min(min, max), Math.max(min, max)];
  });
  const debouncedPrice = useDebounce(price, 300);

  // Remembers the last price range WE committed, so external changes (Reset,
  // chip removal) can be detected and mirrored back into the slider.
  const lastCommittedPrice = useRef<{ min: string; max: string }>({
    min: filters.minPrice,
    max: filters.maxPrice,
  });

  // Resync the slider only when the committed filter changed from the outside,
  // never from our own debounced commits (which would fight the user mid-drag).
  useEffect(() => {
    const min = Number(filters.minPrice) || boundsMin;
    const max = Number(filters.maxPrice) || boundsMax;
    const next: [number, number] = [Math.min(min, max), Math.max(min, max)];
    if (
      filters.minPrice !== lastCommittedPrice.current.min ||
      filters.maxPrice !== lastCommittedPrice.current.max
    ) {
      setPrice(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.minPrice, filters.maxPrice, boundsMin, boundsMax]);

  useEffect(() => {
    const minPrice = debouncedPrice[0] > boundsMin ? String(debouncedPrice[0]) : '';
    const maxPrice = debouncedPrice[1] < boundsMax ? String(debouncedPrice[1]) : '';
    if (minPrice !== filters.minPrice || maxPrice !== filters.maxPrice) {
      lastCommittedPrice.current = { min: minPrice, max: maxPrice };
      onFilterChange({ ...filters, minPrice, maxPrice });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPrice, boundsMin, boundsMax]);

  // Filters commit immediately on every change so results update in real time.
  const commit = (next: FilterState) => onFilterChange(next);

  const handleCategoryToggle = (categoryId: string) => {
    const categories = filters.categories.includes(categoryId)
      ? filters.categories.filter((id) => id !== categoryId)
      : [...filters.categories, categoryId];
    commit({ ...filters, categories });
  };

  const handleRatingSelect = (rating: number) => {
    commit({
      ...filters,
      minRating: filters.minRating === rating ? 0 : rating,
    });
  };

  const handleBrandsChange = (brands: string[]) => {
    commit({ ...filters, brands });
  };

  const handleAvailabilityChange = (inStockOnly: boolean) => {
    commit({ ...filters, inStockOnly });
  };

  const handleFeaturedChange = (featuredOnly: boolean) => {
    commit({ ...filters, featuredOnly });
  };

  const clearAll = () => {
    commit(EMPTY_FILTERS);
  };

  const appliedCount = useMemo(() => activeFilterCount(filters), [filters]);
  const hasActiveFilters = appliedCount > 0;

  const priceRange: [number, number] = [
    Math.min(price[0], price[1]),
    Math.max(price[0], price[1]),
  ];

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-bold text-secondary-800">
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs font-medium text-danger transition-colors hover:text-danger-600"
          >
            <X size={14} />
            Clear All
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles size={13} />
          Filters Applied: {appliedCount}
        </div>
      )}

      <FilterSection title="Category">
        <div className="space-y-2">
          {categoryOptions.map((category) => (
            <label
              key={category.slug}
              className="flex cursor-pointer items-center gap-2.5"
              style={{ paddingLeft: category.depth > 0 ? `${category.depth * 16}px` : undefined }}
            >
              <input
                type="checkbox"
                checked={filters.categories.includes(category.slug)}
                onChange={() => handleCategoryToggle(category.slug)}
                className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary/20"
              />
              <span className="text-sm text-muted-600 transition-colors hover:text-secondary-800">
                {category.name}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range">
        <PriceRangeSlider
          min={boundsMin}
          max={boundsMax}
          step={500}
          value={priceRange}
          onChange={setPrice}
        />
      </FilterSection>

      <FilterSection title="Rating">
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingSelect(rating)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                filters.minRating === rating
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-600 hover:bg-muted-50'
              )}
            >
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i < rating ? 'fill-warning text-warning' : 'text-muted-300'
                    }
                  />
                ))}
              </div>
              <span>& up</span>
            </button>
          ))}
        </div>
      </FilterSection>

      <BrandFilter
        selectedBrands={filters.brands}
        onChange={handleBrandsChange}
      />

      <AvailabilityToggle
        inStockOnly={filters.inStockOnly}
        onChange={handleAvailabilityChange}
      />

      <div className="border-b border-muted-100 py-4">
        <p className="mb-3 text-sm font-semibold text-secondary-800">Featured</p>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={filters.featuredOnly}
            onChange={() => handleFeaturedChange(!filters.featuredOnly)}
            className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary/20"
          />
          <Sparkles size={16} className="text-warning" />
          <span className="text-sm text-muted-600">Featured Only</span>
        </label>
      </div>

      {hasActiveFilters && (
        <div className="mt-4">
          <button
            onClick={clearAll}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-muted-200 px-4 py-2.5 text-sm font-medium text-muted-600 transition-colors hover:bg-muted-50"
          >
            <RotateCcw size={15} />
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}