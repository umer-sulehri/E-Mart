import type { Metadata } from 'next';
import ReviewsPageClient from './ReviewsPageClient';

export const metadata: Metadata = {
  title: 'Customer Reviews',
  description: 'Read authentic customer reviews and ratings for groceries, fresh produce, and everyday essentials at E-Mart.',
  openGraph: {
    title: 'Customer Reviews | E-Mart',
    description: 'Read authentic customer reviews and ratings.',
  },
};

export default function ReviewsPage() {
  return <ReviewsPageClient />;
}
