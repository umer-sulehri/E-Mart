import { type Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Home } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Categories',
  description:
    'Browse all product categories at E-Mart. Find fresh fruits, vegetables, dairy, meat, bakery, and everyday essentials.',
};

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  thumbnail: string;
  productCount?: number;
}

async function fetchCategories(): Promise<ApiCategory[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/v1/categories`,
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error();
    const json = await res.json();
    if (json.success && json.data?.length) return json.data;
    throw new Error();
  } catch {
    return CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      thumbnail: c.thumbnail,
      productCount: Math.floor(Math.random() * 50) + 5,
    }));
  }
}

export default async function CategoriesPage() {
  const categories = await fetchCategories();

  return (
    <>
      {/* Hero */}
      <section className="relative bg-secondary-800 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
            Shop by Category
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">Categories</span>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group rounded-2xl bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
                  <Image
                    src={category.thumbnail}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <div className="p-5 text-center">
                  <h2 className="font-heading text-lg font-bold text-secondary-800 group-hover:text-primary transition-colors">
                    {category.name}
                  </h2>
                  {category.productCount != null && (
                    <p className="mt-1 text-sm text-muted-500">
                      {category.productCount} products
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
