'use client';

import { ChevronDown } from 'lucide-react';

export type SortValue = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popularity';

interface SortDropdownProps {
  value: SortValue;
  onChange: (value: SortValue) => void;
}

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
  { value: 'popularity', label: 'Popularity' },
];

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortValue)}
        className="appearance-none rounded-lg border border-muted-200 bg-white py-2 pl-3 pr-8 text-sm text-secondary-800 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-400"
      />
    </div>
  );
}
