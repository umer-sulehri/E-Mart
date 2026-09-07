'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, Star, Package, ChevronRight, Loader2, Search } from 'lucide-react';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Pagination from '@/components/product/Pagination';
import Input from '@/components/ui/Input';

const ITEMS_PER_PAGE = 12;

interface Seller {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  rating: number;
  total_sales: number;
  created_at: string;
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchSellers() {
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(ITEMS_PER_PAGE),
        });
        if (search) params.set('search', search);
        const res = await fetch(`/api/v1/sellers?${params.toString()}`);
        const json = await res.json();
        if (!cancelled) {
          if (json.success) {
            setSellers(json.data || []);
            setTotalPages(json.meta?.totalPages || 1);
          } else {
            setSellers([]);
          }
        }
      } catch {
        if (!cancelled) setSellers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSellers();
    return () => { cancelled = true; };
  }, [currentPage, search]);

  return (
    <>
      <section className="border-b border-muted-100 bg-white py-4">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Sellers' }]} />
        </div>
      </section>

      <section className="relative bg-secondary-800 py-12">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-12">
          <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
            Our Sellers
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/80">
            Explore our trusted partner stores and discover their fresh, organic products.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <form
            className="mx-auto mb-8 max-w-xl"
            onSubmit={(e) => {
              e.preventDefault();
              setCurrentPage(1);
              setSearch(searchInput.trim());
            }}
          >
            <Input
              icon={<Search className="h-5 w-5 text-muted-400" />}
              type="search"
              placeholder="Search sellers by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search sellers"
            />
          </form>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : sellers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Store size={48} className="mb-4 text-muted-300" />
              <h2 className="mb-2 font-heading text-xl font-bold text-secondary-800">
                No sellers yet
              </h2>
              <p className="max-w-sm text-sm text-muted-500">
                Check back soon as new stores are being added.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sellers.map((seller) => (
                  <Link
                    key={seller.id}
                    href={`/sellers/${seller.slug}`}
                    className="group rounded-2xl border border-muted-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted-100">
                        {seller.logo_url ? (
                          <Image
                            src={seller.logo_url}
                            alt={seller.name}
                            width={64}
                            height={64}
                            className="object-contain"
                          />
                        ) : (
                          <Store size={28} className="text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-heading text-base font-bold text-secondary-800 group-hover:text-primary">
                          {seller.name}
                        </h2>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-500">
                          <span className="flex items-center gap-1">
                            <Star size={12} className="fill-warning text-warning" />
                            {seller.rating.toFixed(1)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package size={12} />
                            {seller.total_sales.toLocaleString()} sales
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-muted-300 group-hover:text-primary" />
                    </div>
                    {seller.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-500">
                        {seller.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
