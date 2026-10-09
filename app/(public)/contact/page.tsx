import { type Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo';
import ContactPageClient from './ContactPageClient';

export const metadata: Metadata = generatePageMetadata(
  'Contact Us',
  'Get in touch with E-Mart. Contact our support team for orders, returns, seller inquiries, and any questions about our organic grocery delivery service.',
  '/contact'
);

export default function ContactPage() {
  return <ContactPageClient />;
}
