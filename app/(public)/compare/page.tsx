import type { Metadata } from 'next';
import ComparePageClient from './ComparePageClient';

export const metadata: Metadata = {
  title: 'Compare Products',
  description: 'Compare prices, features, and ratings side by side to find the best deals at E-Mart.',
  openGraph: {
    title: 'Compare Products | E-Mart',
    description: 'Compare products side by side to find the best deals.',
  },
};

export default function ComparePage() {
  return <ComparePageClient />;
}
