'use client';

import Link from 'next/link';
import { useCategories } from '@/hooks/useCategories';
import { Card } from '@/components/ui/Card';
import { useTranslations } from '@/hooks/useTranslations';

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const { t } = useTranslations();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-surface-alt rounded w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 bg-surface-alt rounded-[12px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="mb-6 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-text-secondary">
          <li><Link href="/" className="hover:text-primary-dark">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-text-primary font-medium">{t('home.shopByCategory')}</li>
        </ol>
      </nav>

      <h1 className="text-3xl font-extrabold text-text-primary mb-8">{t('home.shopByCategory')}</h1>

      <div className="space-y-8">
        {categories.map((cat) => (
          <section key={cat.id}>
            <Link href={`/categories/${cat.slug}`} className="group inline-flex items-center gap-3 mb-4">
              <span className="text-4xl group-hover:scale-110 transition-transform" role="img" aria-label={cat.name}>{cat.icon}</span>
              <h2 className="text-xl font-bold text-text-primary group-hover:text-primary-dark transition-colors">{cat.name}</h2>
            </Link>

            {cat.children && cat.children.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {cat.children.map((sub) => (
                  <Link key={sub.id} href={`/categories/${sub.slug}`}>
                    <Card className="p-4 text-center hover:shadow-md hover:border-primary/30 transition-all cursor-pointer" variant="alt">
                      <span className="text-3xl mb-2 block" role="img" aria-label={sub.name}>{sub.icon}</span>
                      <span className="text-sm font-semibold text-text-primary">{sub.name}</span>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
