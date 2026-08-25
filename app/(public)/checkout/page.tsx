import type { Metadata } from 'next';
import CheckoutPageClient from './CheckoutPageClient';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your order securely at E-Mart. Fast delivery and safe payment options.',
  openGraph: {
    title: 'Checkout | E-Mart',
    description: 'Complete your order securely at E-Mart.',
  },
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
