'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Star, X } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface FilterState {
  categories: string[];
  minPrice: string;
  maxPrice: string;
  minRating: number;
}

interface ProductFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
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
}: ProductFiltersProps) {
  const handleCategoryToggle = (categoryId: string) => {
    const updated = filters.categories.includes(categoryId)
      ? filters.categories.filter((id) => id !== categoryId)
      : [...filters.categories, categoryId];
    onFilterChange({ ...filters, categories: updated });
  };

  const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const handleRatingSelect = (rating: number) => {
    onFilterChange({
      ...filters,
      minRating: filters.minRating === rating ? 0 : rating,
    });
  };

  const clearAll = () => {
    onFilterChange({
      categories: [],
      minPrice: '',
      maxPrice: '',
      minRating: 0,
    });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.minRating > 0;

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
                checked={filters.categories.includes(category.id)}
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
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => handlePriceChange('minPrice', e.target.value)}
            min={0}
            className="w-full rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-muted-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
            min={0}
            className="w-full rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
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
    </div>
  );
}
