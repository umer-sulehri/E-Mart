import type { Metadata } from 'next';
import CartPageClient from './CartPageClient';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review your selected items, update quantities, and proceed to secure checkout at E-Mart.',
  openGraph: {
    title: 'Shopping Cart | E-Mart',
    description: 'Review your selected items and proceed to checkout.',
  },
};

export default function CartPage() {
  return <CartPageClient />;
}
