import type { Metadata } from 'next';
import { Suspense } from 'react';
import ProductsPageClient from '@/app/(public)/products/ProductsPageClient';

export const metadata: Metadata = {
  title: 'Search',
  description:
    'Search E-Mart for fresh organic groceries, fruits, vegetables, dairy, meat, and everyday essentials.',
  openGraph: {
    title: 'Search | E-Mart',
    description: 'Search our wide selection of fresh organic groceries.',
  },
};

export default function SearchPage() {
  return (
    <Suspense>
      <ProductsPageClient />
    </Suspense>
  );
}
