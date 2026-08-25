'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import ReviewList from '@/components/product/ReviewList';
import ReviewForm from '@/components/product/ReviewForm';
import type { Product } from '@/types';

interface ProductTabsProps {
  product: Product;
}

const tabs = [
  { id: 'description', label: 'Description' },
  { id: 'specifications', label: 'Specifications' },
  { id: 'reviews', label: 'Reviews' },
] as const;

type TabId = (typeof tabs)[number]['id'];

function SpecsTable({ specs }: { specs: Record<string, string> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-muted-100">
      {Object.entries(specs).map(([key, value], index) => (
        <div
          key={key}
          className={cn(
            'flex border-b border-muted-100 last:border-b-0',
            index % 2 === 0 ? 'bg-white' : 'bg-muted-50'
          )}
        >
          <div className="w-1/3 px-4 py-3 text-sm font-medium text-secondary-700">
            {key}
          </div>
          <div className="w-2/3 px-4 py-3 text-sm text-muted-700">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = React.useState<TabId>('description');

  return (
    <div className="space-y-6">
      {/* Tab Headers */}
      <div className="border-b border-muted-200">
        <div className="flex gap-0" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'border-b-2 px-6 py-3 text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-primary font-semibold text-primary'
                  : 'border-transparent font-medium text-muted-600 hover:text-secondary-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'description' && (
        <div className="max-w-3xl">
          <h3 className="mb-4 font-heading text-xl font-bold text-secondary-800">
            Product Description
          </h3>
          <p className="leading-relaxed text-muted-700">
            {product.description}
          </p>
          {product.tags && product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted-100 px-3 py-1 text-xs font-medium text-muted-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'specifications' && (
        <div>
          <h3 className="mb-4 font-heading text-xl font-bold text-secondary-800">
            Specifications
          </h3>
          {product.specifications ? (
            <SpecsTable specs={product.specifications} />
          ) : (
            <p className="text-sm text-muted-500">
              No specifications available for this product.
            </p>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div>
          <ReviewList />
          <div className="mt-8 border-t border-muted-100 pt-8">
            <ReviewForm productName={product.name} />
          </div>
        </div>
      )}
    </div>
  );
}
