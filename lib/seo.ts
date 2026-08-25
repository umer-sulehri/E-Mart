import type { Metadata } from 'next';
import { SITE_CONFIG } from './constants';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
  const url = product.slug
    ? `${SITE_URL}/products/${product.slug}`
    : undefined;

  return {
    title: product.name,
    description,
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
