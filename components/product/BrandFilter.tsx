'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const BRANDS = [
  { id: 'nature-best', name: 'Nature\'s Best', count: 24 },
  { id: 'farm-fresh', name: 'Farm Fresh', count: 18 },
  { id: 'organic-valley', name: 'Organic Valley', count: 15 },
  { id: 'green-harvest', name: 'Green Harvest', count: 12 },
  { id: 'pure-earth', name: 'Pure Earth', count: 9 },
  { id: 'meadow-gold', name: 'Meadow Gold', count: 7 },
];

interface BrandFilterProps {
  selectedBrands: string[];
  onChange: (brands: string[]) => void;
}

export default function BrandFilter({
  selectedBrands,
  onChange,
}: BrandFilterProps) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleBrand = (brandId: string) => {
    if (selectedBrands.includes(brandId)) {
      onChange(selectedBrands.filter((id) => id !== brandId));
    } else {
      onChange([...selectedBrands, brandId]);
    }
  };

  return (
    <div className="border-b border-muted-100 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-sm font-semibold text-secondary-800"
      >
        Brand
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isOpen && (
        <div className="mt-3 space-y-2">
          {BRANDS.map((brand) => (
            <label
              key={brand.id}
              className="flex cursor-pointer items-center gap-2.5"
            >
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand.id)}
                onChange={() => toggleBrand(brand.id)}
                className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary/20"
              />
              <span className="text-sm text-muted-600 transition-colors hover:text-secondary-800">
                {brand.name}
              </span>
              <span className="ml-auto text-xs text-muted-400">
                {brand.count}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
