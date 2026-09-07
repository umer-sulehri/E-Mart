import type { Metadata } from 'next';
import SellersClient from './SellersClient';

export const metadata: Metadata = {
  title: 'Our Sellers',
  description:
    'Explore E-Mart’s trusted partner stores and discover their fresh, organic products, ratings, and more.',
  openGraph: {
    title: 'Our Sellers | E-Mart',
    description:
      'Explore E-Mart’s trusted partner stores and discover their fresh, organic products.',
    type: 'website',
  },
};

export default function SellersPage() {
  return <SellersClient />;
}