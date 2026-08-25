'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import SectionHeader from '@/components/ui/SectionHeader';

interface Tag {
  label: string;
  slug: string;
  highlighted?: boolean;
}

const tags: Tag[] = [
  { label: 'Organic', slug: 'organic', highlighted: true },
  { label: 'Apple', slug: 'apple' },
  { label: 'Milk', slug: 'milk', highlighted: true },
  { label: 'Bread', slug: 'bread' },
  { label: 'Potato', slug: 'potato' },
  { label: 'Chicken', slug: 'chicken', highlighted: true },
  { label: 'Rice', slug: 'rice' },
  { label: 'Tomato', slug: 'tomato' },
  { label: 'Banana', slug: 'banana', highlighted: true },
  { label: 'Egg', slug: 'egg' },
  { label: 'Cheese', slug: 'cheese' },
  { label: 'Honey', slug: 'honey', highlighted: true },
  { label: 'Orange', slug: 'orange' },
  { label: 'Broccoli', slug: 'broccoli' },
  { label: 'Almonds', slug: 'almonds', highlighted: true },
  { label: 'Yogurt', slug: 'yogurt' },
  { label: 'Avocado', slug: 'avocado' },
  { label: 'Strawberry', slug: 'strawberry', highlighted: true },
  { label: 'Carrot', slug: 'carrot' },
  { label: 'Spinach', slug: 'spinach' },
];

const PopularTags = React.forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => {
    return (
      <section ref={ref} className={cn('py-4', className)}>
        <h2 className="my-4 text-2xl font-bold text-dark">People are also looking for</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/search?tag=${tag.slug}`}
              className="inline-flex items-center rounded-[0.375rem] bg-[#FCF7EB] px-4 py-2 text-sm font-medium text-muted hover:bg-primary hover:text-white transition-colors"
            >
              {tag.label}
            </Link>
          ))}
        </div>
      </section>
    );
  }
);

PopularTags.displayName = 'PopularTags';

export default PopularTags;
