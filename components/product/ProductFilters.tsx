'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Star, X, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import BrandFilter from '@/components/product/BrandFilter';
import AvailabilityToggle from '@/components/ui/AvailabilityToggle';
import PriceRangeSlider from '@/components/ui/PriceRangeSlider';

export interface FilterState {
  categories: string[];
  minPrice: string;
  maxPrice: string;
  minRating: number;
  brands: string[];
  inStockOnly: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  categories: [],
  minPrice: '',
  maxPrice: '',
  minRating: 0,
  brands: [],
  inStockOnly: false,
};

interface ProductFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onApplied?: () => void;
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
  onApplied,
}: ProductFiltersProps) {
  // Local draft state — edits are not applied until "Apply Filters" is pressed.
  const [draft, setDraft] = useState<FilterState>(filters);

  // Sync draft whenever the committed filters change externally (e.g. clearing
  // an active-filter chip or clicking "Reset" on the results header).
  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const handleCategoryToggle = (categoryId: string) => {
    const updated = draft.categories.includes(categoryId)
      ? draft.categories.filter((id) => id !== categoryId)
      : [...draft.categories, categoryId];
    setDraft({ ...draft, categories: updated });
  };

  const handleRatingSelect = (rating: number) => {
    setDraft({
      ...draft,
      minRating: draft.minRating === rating ? 0 : rating,
    });
  };

  const handleBrandsChange = (brands: string[]) => {
    setDraft({ ...draft, brands });
  };

  const handleAvailabilityChange = (inStockOnly: boolean) => {
    setDraft({ ...draft, inStockOnly });
  };

  const minPriceVal = Number(draft.minPrice) || 0;
  const maxPriceVal = Number(draft.maxPrice) || 100000;
  const priceRange: [number, number] = [
    Math.min(minPriceVal, maxPriceVal),
    Math.max(minPriceVal, maxPriceVal),
  ];

  const handlePriceSliderChange = (range: [number, number]) => {
    setDraft({
      ...draft,
      minPrice: range[0] > 0 ? String(range[0]) : '',
      maxPrice: range[1] < 100000 ? String(range[1]) : '',
    });
  };

  const apply = () => {
    onFilterChange(draft);
    onApplied?.();
  };

  const clearAll = () => {
    setDraft(EMPTY_FILTERS);
    onFilterChange(EMPTY_FILTERS);
  };

  const hasActiveFilters =
    draft.categories.length > 0 ||
    draft.minPrice !== '' ||
    draft.maxPrice !== '' ||
    draft.minRating > 0 ||
    draft.brands.length > 0 ||
    draft.inStockOnly;

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

      <FilterSection title="Category">
        <div className="space-y-2">
          {CATEGORIES.map((category) => (
            <label
              key={category.id}
              className="flex cursor-pointer items-center gap-2.5"
            >
              <input
                type="checkbox"
                checked={draft.categories.includes(category.id)}
                onChange={() => handleCategoryToggle(category.id)}
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
          min={0}
          max={100000}
          step={500}
          value={priceRange}
          onChange={handlePriceSliderChange}
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
                draft.minRating === rating
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
        selectedBrands={draft.brands}
        onChange={handleBrandsChange}
      />

      <AvailabilityToggle
        inStockOnly={draft.inStockOnly}
        onChange={handleAvailabilityChange}
      />

      <div className="mt-4 flex flex-col gap-2">
        <button
          onClick={apply}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <SlidersHorizontal size={15} />
          Apply Filters
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="inline-flex w-full items-center justify-center rounded-lg border border-muted-200 px-4 py-2 text-sm font-medium text-muted-600 transition-colors hover:bg-muted-50"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
