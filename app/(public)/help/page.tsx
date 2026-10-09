import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo';
import HelpPageClient from './HelpPageClient';

export const metadata: Metadata = generatePageMetadata(
  'Help & Support',
  'Get help with your E-Mart grocery order: delivery, payments, returns, seller questions and account support.',
  '/help'
);

export default function HelpPage() {
  return <HelpPageClient />;
}