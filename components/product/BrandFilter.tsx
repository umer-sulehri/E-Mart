'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface BrandFilterProps {
  selectedBrands: string[];
  onChange: (brands: string[]) => void;
}

export default function BrandFilter({
  selectedBrands,
  onChange,
}: BrandFilterProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/brands')
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success && Array.isArray(json.data)) {
          setBrands(json.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || brands.length === 0) return null;

  const toggleBrand = (brandSlug: string) => {
    if (selectedBrands.includes(brandSlug)) {
      onChange(selectedBrands.filter((slug) => slug !== brandSlug));
    } else {
      onChange([...selectedBrands, brandSlug]);
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
          {brands.map((brand) => (
            <label
              key={brand.id}
              className={cn('flex cursor-pointer items-center gap-2.5')}
            >
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand.slug)}
                onChange={() => toggleBrand(brand.slug)}
                className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary/20"
              />
              <span className="text-sm text-muted-600 transition-colors hover:text-secondary-800">
                {brand.name}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}