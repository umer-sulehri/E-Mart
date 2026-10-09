import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo';
import FaqPageClient from './FaqPageClient';

export const metadata: Metadata = generatePageMetadata(
  'Frequently Asked Questions',
  'Find answers to common questions about E-Mart grocery delivery, orders, payments, shipping, returns, and account management.',
  '/faq'
);

export default function FaqPage() {
  return <FaqPageClient />;
}
