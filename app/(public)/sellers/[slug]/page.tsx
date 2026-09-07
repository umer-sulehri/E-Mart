import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SellerStoreClient from './SellerStoreClient';

interface SellerStorePageProps {
  params: Promise<{ slug: string }>;
}

async function getSellerMetadata(slug: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('vendors')
      .select('name, slug, description, logo_url, rating')
      .eq('slug', slug)
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: SellerStorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const seller = await getSellerMetadata(slug);

  if (!seller) {
    return {
      title: 'Store Not Found',
      description: 'The seller store you are looking for does not exist or is unavailable.',
    };
  }

  const title = `${seller.name} | E-Mart Store`;
  const description = seller.description
    ? seller.description
    : `Shop fresh organic products from ${seller.name} on E-Mart.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: seller.logo_url
        ? [{ url: seller.logo_url, alt: seller.name }]
        : undefined,
    },
  };
}

export default async function SellerStorePage({ params }: SellerStorePageProps) {
  const { slug } = await params;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('vendors')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!data) notFound();
  } catch {
    // Let the client component render its own fallback on transient DB errors.
  }

  return <SellerStoreClient />;
}