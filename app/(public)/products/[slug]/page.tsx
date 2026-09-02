import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductGallery from '@/components/product/ProductGallery';
import ProductCarousel from '@/components/product/ProductCarousel';
import ProductTabs from '@/components/product/ProductTabs';
import ProductDetailClient from './ProductDetailClient';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { calculateDiscount, formatPrice } from '@/lib/utils';
import { generateProductMetadata } from '@/lib/seo';
import { apiProductToCardProduct } from '@/lib/api';
import type { Product } from '@/types';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/v1/products/${slug}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !json.data) return null;

    const p = json.data;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      shortDescription: p.short_description,
      price: p.price,
      discountPrice: p.discount_price,
      stockQuantity: p.stock_quantity ?? 0,
      sku: p.sku || '',
      category: p.categories
        ? {
            id: p.categories.id || '',
            name: p.categories.name,
            slug: p.categories.slug,
            isActive: true,
            displayOrder: 0,
            createdAt: '',
            updatedAt: '',
          }
        : p.category
          ? {
              id: p.category.id || '',
              name: p.category.name,
              slug: p.category.slug,
              isActive: true,
              displayOrder: 0,
              createdAt: '',
              updatedAt: '',
            }
          : { id: '', name: '', slug: '', isActive: true, displayOrder: 0, createdAt: '', updatedAt: '' },
      categoryId: p.categories?.id || p.category?.id || '',
      brand: p.brands
        ? {
            id: p.brands.id || '',
            name: p.brands.name,
            slug: p.brands.slug,
            isActive: true,
            createdAt: '',
            updatedAt: '',
          }
        : p.brand
          ? {
              id: p.brand.id || '',
              name: p.brand.name,
              slug: p.brand.slug,
              isActive: true,
              createdAt: '',
              updatedAt: '',
            }
          : undefined,
      brandId: p.brands?.id || p.brand?.id,
      rating: p.averageRating ?? p.rating ?? 0,
      reviewCount: p.reviewCount ?? 0,
      isActive: p.is_active ?? true,
      isFeatured: p.is_featured ?? false,
      isNew: p.is_new ?? false,
      images: p.images || [],
      specifications: p.specifications,
      tags: p.tags,
      weight: p.weight,
      vendor: p.vendors
        ? {
            id: p.vendors.id || '',
            name: p.vendors.name,
            slug: p.vendors.slug,
            contactEmail: '',
            status: 'approved' as const,
            userId: '',
            rating: p.vendors.rating ?? 0,
            totalSales: p.vendors.total_sales ?? 0,
            commissionRate: 0,
            createdAt: '',
            updatedAt: '',
          }
        : p.vendor
          ? {
              id: p.vendor.id || '',
              name: p.vendor.name,
              slug: p.vendor.slug,
              contactEmail: '',
              status: 'approved' as const,
              userId: '',
              rating: p.vendor.rating ?? 0,
              totalSales: p.vendor.total_sales ?? 0,
              commissionRate: 0,
              createdAt: '',
              updatedAt: '',
            }
          : undefined,
      vendorId: p.vendors?.id || p.vendor?.id,
      createdAt: p.created_at || '',
      updatedAt: p.updated_at || '',
    } as Product;
  } catch {
    return null;
  }
}

async function fetchRelatedProducts(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/v1/products?limit=8&status=active`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.success || !json.data) return [];
    return (json.data as any[])
      .filter((p: any) => p.slug !== slug)
      .slice(0, 5)
      .map(apiProductToCardProduct);
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  // No static pre-generation — product slugs come from the live database,
  // so pages are rendered on-demand (ISR/dynamic).
  return [];
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  const product = await fetchProductBySlug(slug);
  if (!product) {
    return { title: 'Product Not Found' };
  }

  return generateProductMetadata({
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    images: product.images,
    slug: product.slug,
  });
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;

  let product = await fetchProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await fetchRelatedProducts(slug);

  const hasDiscount =
    product.discountPrice != null && product.discountPrice < product.price;
  const discount = hasDiscount
    ? calculateDiscount(product.price, product.discountPrice!)
    : 0;

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description:
              product.shortDescription || product.description?.slice(0, 500),
            image: product.images?.[0]
              ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://emart.pk'}${product.images[0]}`
              : undefined,
            sku: product.sku || undefined,
            brand: product.brand
              ? { '@type': 'Brand', name: product.brand.name }
              : undefined,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'PKR',
              price: product.discountPrice ?? product.price,
              availability:
                product.stockQuantity > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
              url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://emart.pk'}/products/${product.slug}`,
            },
            aggregateRating:
              product.rating > 0
                ? {
                    '@type': 'AggregateRating',
                    ratingValue: product.rating,
                    reviewCount: product.reviewCount,
                  }
                : undefined,
          }),
        }}
      />

      {/* Breadcrumb */}
      <section className="border-b border-muted-100 bg-white py-4">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: 'Products', href: '/products' },
              {
                label: product.category.name,
                href: `/products?category=${product.category.slug}`,
              },
              { label: product.name },
            ]}
          />
        </div>
      </section>

      {/* Product Detail */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left: Gallery */}
            <ProductGallery
              images={product.images}
              productName={product.name}
            />

            {/* Right: Product Info */}
            <ProductDetailClient
              product={product}
              hasDiscount={hasDiscount}
              discount={discount}
            />
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="border-t border-muted-100 py-8 lg:py-12">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <ProductTabs product={product} />
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <ProductCarousel
          title="Related Products"
          products={relatedProducts}
          viewAllLink="/products"
        />
      )}
    </>
  );
}
