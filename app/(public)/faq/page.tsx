import { type Metadata } from 'next';
import FaqPageClient from './FaqPageClient';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Find answers to common questions about E-Mart grocery delivery, orders, payments, shipping, returns, and account management.',
  openGraph: {
    title: 'Frequently Asked Questions | E-Mart',
    description:
      'Find answers to common questions about E-Mart grocery delivery, orders, payments, shipping, returns, and account management.',
  },
};

export default function FaqPage() {
  return <FaqPageClient />;
}
