import type { Metadata } from 'next';
import WishlistPageClient from './WishlistPageClient';

export const metadata: Metadata = {
  title: 'Wishlist',
  description: 'Save your favorite products for later. Keep track of items you love at E-Mart.',
  openGraph: {
    title: 'Wishlist | E-Mart',
    description: 'Save your favorite products for later.',
  },
};

export default function WishlistPage() {
  return <WishlistPageClient />;
}
