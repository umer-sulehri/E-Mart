import type { Metadata } from 'next';
import ProductsPageClient from './ProductsPageClient';

export const metadata: Metadata = {
  title: 'Products',
  description: 'Browse our wide selection of fresh organic groceries, fruits, vegetables, dairy, meat, and everyday essentials.',
  openGraph: {
    title: 'Products | E-Mart',
    description: 'Browse our wide selection of fresh organic groceries.',
  },
};

export default function ProductsPage() {
  return <ProductsPageClient />;
}
