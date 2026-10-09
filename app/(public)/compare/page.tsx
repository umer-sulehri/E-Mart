import type { Metadata } from 'next';
import ComparePageClient from './ComparePageClient';
import { generatePageMetadata } from '@/lib/seo';

// Generated through the shared helper so the canonical, Open Graph and Twitter
// cards stay consistent with the rest of the site. The canonical is the bare
// `/compare` path: the `?products=` deep link is one of many permutations of the
// same page and should not compete with it in search results.
export const metadata: Metadata = generatePageMetadata(
  'Compare Products',
  'Compare prices, features, and ratings side by side to find the best deals at E-Mart. Products must belong to the same category for a meaningful comparison.',
  '/compare'
);

export default function ComparePage({
  searchParams,
}: {
  searchParams: { products?: string };
}) {
  const initialProductSlugs = (searchParams.products || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return <ComparePageClient initialProductSlugs={initialProductSlugs} />;
}
