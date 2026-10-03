import type { Metadata } from 'next';
import { SITE_CONFIG } from './constants';

// Canonicals and OG URLs must be absolute and must never be localhost: a
// canonical pointing at localhost tells search engines the real page lives on a
// developer's machine. NEXT_PUBLIC_SITE_URL is set in the Vercel project, so the
// fallback is the live host rather than a dev URL — a wrong absolute URL is a
// far smaller SEO problem than an unusable one.
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://e-mart-sand-pi.vercel.app'
).replace(/\/$/, '');

/**
 * The canonical public origin. Exported so `app/layout.tsx`, `robots.ts` and
 * `sitemap.ts` resolve absolute URLs from the same value — these previously
 * carried three different fallbacks (localhost, the emart.pk placeholder, and
 * this one), so an unset env var produced a different absolute URL per file.
 */
export { SITE_URL };

interface ProductMetadataInput {
  name: string;
  shortDescription?: string;
  description?: string;
  images?: string[];
  slug?: string;
}

export function generateProductMetadata(product: ProductMetadataInput): Metadata {
  const description =
    product.shortDescription || product.description?.slice(0, 160) || '';
  const imageUrl = product.images?.[0] || SITE_CONFIG.ogImage;
  const path = product.slug ? `/products/${product.slug}` : undefined;
  const url = path ? `${SITE_URL}${path}` : undefined;

  return {
    title: product.name,
    description,
    // Without this, a product reachable under several query-string or pagination
    // variants is indexed as separate URLs competing with each other.
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title: product.name,
      description,
      url,
      siteName: SITE_CONFIG.name,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: [imageUrl],
    },
  };
}

export function generatePageMetadata(
  title: string,
  description: string,
  path?: string
): Metadata {
  const url = path ? `${SITE_URL}${path}` : undefined;

  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_CONFIG.name,
      type: 'website',
      images: [
        {
          url: SITE_CONFIG.ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [SITE_CONFIG.ogImage],
    },
  };
}
