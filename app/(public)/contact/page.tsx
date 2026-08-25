import { type Metadata } from 'next';
import ContactPageClient from './ContactPageClient';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with E-Mart. Contact our support team for orders, returns, seller inquiries, and any questions about our organic grocery delivery service.',
  openGraph: {
    title: 'Contact Us | E-Mart',
    description:
      'Get in touch with E-Mart. Contact our support team for orders, returns, seller inquiries, and any questions about our organic grocery delivery service.',
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
