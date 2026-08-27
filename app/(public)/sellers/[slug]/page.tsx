'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { Package, Star, Store } from 'lucide-react';
import type { Product } from '@/components/product/ProductCard';
import ProductGrid from '@/components/product/ProductGrid';
import Pagination from '@/components/product/Pagination';
import SortDropdown, { type SortValue } from '@/components/product/SortDropdown';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useParams, useSearchParams } from 'next/navigation';
import {
  apiProductToCardProduct,
  type ApiProduct,
  type ApiListResponse,
} from '@/lib/api';
import { formatDate } from '@/lib/utils';

const ITEMS_PER_PAGE = 15;

interface SellerInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  rating: number;
  total_sales: number;
  created_at: string;
}

function SellerStoreContent() {
  const params = useParams() as { slug: string };
  const slug = params.slug;
  const searchParams = useSearchParams();

  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<SortValue>('newest');

  const query = searchParams.get('q') || '';

  const fetchSeller = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/v1/sellers/${encodeURIComponent(slug)}?page=${currentPage}&limit=${ITEMS_PER_PAGE}&sort=${sort}`
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        setNotFound(true);
        return;
      }
      setSeller(json.data.seller);
      const mapped = (json.data.products || []).map(apiProductToCardProduct);
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const filtered = (mapped as Product[]).filter(
          (p: Product) =>
            p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
        );
        setProducts(filtered);
        setTotalItems(filtered.length);
      } else {
        setProducts(mapped);
        setTotalItems(json.meta?.totalItems || mapped.length);
      }
      setTotalPages(json.meta?.totalPages || 1);
      setNotFound(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug, currentPage, sort, query]);

  useEffect(() => {
    setLoading(true);
    fetchSeller();
  }, [fetchSeller]);

  return (
    <>
      {/* Breadcrumb */}
      <section className="border-b border-muted-100 bg-white py-4">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Sellers', href: '/sellers' },
              { label: seller?.name || (slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())) },
            ]}
          />
        </div>
      </section>

      {notFound ? (
        <section className="flex flex-col items-center justify-center py-24 text-center">
          <Store size={48} className="mb-4 text-muted-300" />
          <h1 className="mb-2 font-heading text-2xl font-bold text-secondary-800">
            Store Not Found
          </h1>
          <p className="mb-6 max-w-sm text-sm text-muted-500">
            The seller store you&apos;re looking for doesn&apos;t exist or is no longer available.
          </p>
          <Link
            href="/products"
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-500"
          >
            Browse Products
          </Link>
        </section>
      ) : (
        <>
          {/* Seller Hero */}
          <section className="relative bg-secondary-800 py-10">
            <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
              {loading ? (
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 animate-pulse rounded-2xl bg-white/20" />
                  <div className="space-y-2">
                    <div className="h-6 w-48 animate-pulse rounded bg-white/20" />
                    <div className="h-4 w-64 animate-pulse rounded bg-white/10" />
                  </div>
                </div>
              ) : (
                seller && (
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
                      {seller.logo_url ? (
                        <Image
                          src={seller.logo_url}
                          alt={seller.name}
                          width={80}
                          height={80}
                          className="object-contain"
                        />
                      ) : (
                        <Store size={36} className="text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="font-heading text-2xl font-bold text-white md:text-3xl">
                          {seller.name}
                        </h1>
                        <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white">
                          <Star size={12} className="fill-warning text-warning" />
                          {seller.rating.toFixed(1)}
                        </span>
                      </div>
                      {seller.description && (
                        <p className="mt-1 max-w-xl text-sm text-white/80">
                          {seller.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-white/70">
                        <span className="flex items-center gap-1">
                          <Package size={12} />
                          {seller.total_sales.toLocaleString()} sales
                        </span>
                        <span>Member since {formatDate(seller.created_at)}</span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {/* Products */}
          <section className="py-8">
            <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-500">
                  {loading ? (
                    'Loading products...'
                  ) : (
                    <>
                      Showing{' '}
                      <span className="font-medium text-secondary-800">{totalItems}</span>{' '}
                      {totalItems === 1 ? 'product' : 'products'}
                    </>
                  )}
                </p>
                <SortDropdown value={sort} onChange={setSort} />
              </div>

              {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                        <div className="mx-auto h-[210px] w-[210px] rounded-lg bg-muted-100" />
                        <div className="mx-auto mt-3 h-4 w-3/4 rounded bg-muted-100" />
                        <div className="mx-auto mt-2 h-3 w-1/2 rounded bg-muted-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
                  <Package size={40} className="mb-3 text-muted-300" />
                  <p className="text-sm text-muted-500">No products found in this store.</p>
                </div>
              ) : (
                <>
                  <ProductGrid products={products} />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default function SellerStorePage() {
  return (
    <Suspense>
      <SellerStoreContent />
    </Suspense>
  );
}
