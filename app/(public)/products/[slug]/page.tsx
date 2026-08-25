import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import ProductGallery from '@/components/product/ProductGallery';
import ProductCarousel from '@/components/product/ProductCarousel';
import ProductTabs from '@/components/product/ProductTabs';
import ProductDetailClient from './ProductDetailClient';
import {
  getProductBySlug,
  getAllProductSlugs,
  getRelatedProducts,
} from '@/lib/mock/product-detail';
import { calculateDiscount } from '@/lib/utils';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: product.name,
    description:
      product.shortDescription || product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description:
        product.shortDescription || product.description.slice(0, 160),
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(slug);
  const hasDiscount =
    product.discountPrice != null && product.discountPrice < product.price;
  const discount = hasDiscount
    ? calculateDiscount(product.price, product.discountPrice!)
    : 0;

  const carouselProducts = relatedProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    discountPrice: p.discountPrice,
    rating: p.rating,
    reviewCount: p.reviewCount,
    image: p.images[0] || '/images/product-1.jpg',
  }));

  return (
    <>
      {/* Breadcrumb */}
      <section className="border-b border-muted-100 bg-white py-4">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-600">
            <Link
              href="/"
              className="flex items-center gap-1 text-muted-600 transition-colors hover:text-primary"
            >
              <Home size={14} />
              Home
            </Link>
            <ChevronRight size={12} className="text-muted-400" />
            <Link
              href="/products"
              className="text-muted-600 transition-colors hover:text-primary"
            >
              Products
            </Link>
            <ChevronRight size={12} className="text-muted-400" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="text-muted-600 transition-colors hover:text-primary"
            >
              {product.category.name}
            </Link>
            <ChevronRight size={12} className="text-muted-400" />
            <span className="font-medium text-secondary-800">
              {product.name}
            </span>
          </nav>
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
      {carouselProducts.length > 0 && (
        <ProductCarousel
          title="Related Products"
          products={carouselProducts}
          viewAllLink="/products"
        />
      )}
    </>
  );
}
