'use client';

import { Package, PackageX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvailabilityToggleProps {
  inStockOnly: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}

export default function AvailabilityToggle({
  inStockOnly,
  onChange,
  className,
}: AvailabilityToggleProps) {
  return (
    <div className={cn('border-b border-muted-100 py-4')}>
      <p className="mb-3 text-sm font-semibold text-secondary-800">
        Availability
      </p>
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={!inStockOnly}
            onChange={() => onChange(!inStockOnly)}
            className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary/20"
          />
          <Package size={16} className="text-success" />
          <span className="text-sm text-muted-600">In Stock</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={() => onChange(!inStockOnly)}
            className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary/20"
          />
          <PackageX size={16} className="text-danger" />
          <span className="text-sm text-muted-600">Out of Stock</span>
        </label>
      </div>
    </div>
  );
}
