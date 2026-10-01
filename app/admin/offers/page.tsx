'use client';

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Loader2,
  BadgePercent,
  Star,
  Sparkles,
  Save,
  Check,
  Store,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, formatPrice } from '@/lib/utils';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import Pagination from '@/components/ui/Pagination';
import { resolveImage } from '@/lib/imageLoader';
import { useDebounce } from '@/hooks/useDebounce';
import { usePageParam } from '@/hooks/usePageParam';
import { PAGE_SIZE } from '@/lib/pagination';

interface OfferProduct {
  id: string;
  name: string;
  sku?: string;
  images: string[] | null;
  price: number;
  discount_price: number | null;
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
  vendors?: { name?: string; slug?: string; profiles?: { first_name?: string; last_name?: string } } | null;
  categories?: { name: string } | null;
}

interface SellerOption {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  commission_rate: number | null;
}

type SavingId = string | null;

type OfferStats = { featured: number; isNew: number; discounted: number };

export default function AdminOffersPage() {
  // `usePageParam` reads `useSearchParams`, which must sit behind Suspense.
  return (
    <Suspense>
      <AdminOffersContent />
    </Suspense>
  );
}

function AdminOffersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [products, setProducts] = useState<OfferProduct[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [stats, setStats] = useState<OfferStats>({
    featured: 0,
    isNew: 0,
    discounted: 0,
  });
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  // Controlled box, debounced term: every keystroke would otherwise be a request.
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400).trim();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<{ id: string; field: string } | null>(null);
  const [justSaved, setJustSaved] = useState<SavingId>(null);
  const [sellerDropdownOpen, setSellerDropdownOpen] = useState(false);
  const sellerDropdownRef = useRef<HTMLDivElement>(null);

  // Filters live in the URL, so a given view of this table is shareable and
  // survives a refresh or a back/forward step.
  const statusFilter = searchParams.get('status') ?? 'all';
  const sellerFilter = useMemo(
    () => (searchParams.get('sellers') ?? '').split(',').filter(Boolean),
    [searchParams]
  );
  const typeFilter = useMemo(
    () => ({
      featured: searchParams.get('featured') === 'true',
      isNew: searchParams.get('isNew') === 'true',
      discounted: searchParams.get('onSale') === 'true',
    }),
    [searchParams]
  );

  const { page: currentPage, setPage: setCurrentPage } = usePageParam({
    resetOn: [search, statusFilter, sellerFilter.join(',')],
  });

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      // Filters are the page's real state, so they go in the history stack and
      // Back actually undoes a filter change.
      if (!value) params.delete(key);
      else params.set(key, value);
      params.delete('page');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/admin/sellers?limit=100')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success && Array.isArray(json.data)) {
          setSellers(json.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sellerDropdownRef.current && !sellerDropdownRef.current.contains(e.target as Node)) {
        setSellerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set('search', search);
      if (sellerFilter.length > 0) params.set('sellers', sellerFilter.join(','));
      if (typeFilter.featured) params.set('featured', 'true');
      if (typeFilter.isNew) params.set('isNew', 'true');
      if (typeFilter.discounted) params.set('onSale', 'true');

      const res = await fetch(`/api/v1/admin/products?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
        if (json.stats) setStats(json.stats);
        const items = json.meta?.totalItems ?? 0;
        const pages = json.meta?.totalPages ?? 1;
        setTotalItems(items);
        setTotalPages(pages);
        // Marking a row can drop it out of the current filter, leaving the last
        // page empty. Fall back to the final page that still has rows.
        if (currentPage > pages) setCurrentPage(pages);
      } else {
        setError(json.error || 'Failed to load products');
        setProducts([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, sellerFilter, typeFilter, currentPage, setCurrentPage]);

  useEffect(() => {
    load();
  }, [load]);

  const saveField = useCallback(
    async (id: string, field: string, value: unknown) => {
      setSaving({ id, field });
      try {
        const res = await fetch('/api/v1/admin/products/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_ids: [id],
            updates: { [field]: value, updated_at: new Date().toISOString() },
          }),
        });
        const json = await res.json();
        if (json.success) {
          setProducts((prev) =>
            prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
          );
          setJustSaved(id);
          setTimeout(() => setJustSaved(null), 1500);
        } else {
          setError(json.error || 'Update failed');
          toast.error(json.error || 'Update failed');
        }
      } catch {
        setError('Update failed');
        toast.error('Update failed');
      } finally {
        setSaving(null);
      }
    },
    []
  );

  const sellerName = useCallback(
    (v: OfferProduct['vendors']) => {
      const profileName = [v?.profiles?.first_name, v?.profiles?.last_name]
        .filter(Boolean)
        .join(' ');
      return profileName || v?.name || 'No Seller';
    },
    []
  );

  const toggleSeller = (slug: string) => {
    const next = sellerFilter.includes(slug)
      ? sellerFilter.filter((s) => s !== slug)
      : [...sellerFilter, slug];
    setParam('sellers', next.join(','));
  };

  const activeFilterCount =
    (sellerFilter.length > 0 ? 1 : 0) +
    (typeFilter.featured || typeFilter.isNew || typeFilter.discounted ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (search ? 1 : 0);

  const resetFilters = () => {
    setSearchInput('');
    setParam('sellers', null);
    setParam('featured', null);
    setParam('isNew', null);
    setParam('onSale', null);
    setParam('status', null);
  };

  const toggleType = (key: keyof typeof typeFilter) => {
    const param = key === 'discounted' ? 'onSale' : key;
    setParam(param, typeFilter[key] ? null : 'true');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">Offers</h1>
        <p className="text-sm text-muted-500">
          Manage featured, new and discounted products
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{stats.featured}</p>
              <p className="text-xs text-muted-500">Featured Products</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{stats.isNew}</p>
              <p className="text-xs text-muted-500">New Arrivals</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-100 text-danger-600">
              <BadgePercent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{stats.discounted}</p>
              <p className="text-xs text-muted-500">Discounted Products</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-muted-200 bg-white py-2 pl-10 pr-4 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Seller filter (multi-select dropdown) */}
          <div ref={sellerDropdownRef} className="relative min-w-[200px]">
            <button
              type="button"
              onClick={() => setSellerDropdownOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-800 hover:border-muted-300"
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Store size={15} className="text-muted-400" />
                {sellerFilter.length > 0
                  ? `${sellerFilter.length} seller${sellerFilter.length > 1 ? 's' : ''}`
                  : 'All Sellers'}
              </span>
              <ChevronDown size={15} className="text-muted-400" />
            </button>
            {sellerDropdownOpen && (
              <div className="absolute right-0 z-20 mt-1 max-h-72 w-72 overflow-y-auto rounded-xl border border-muted-200 bg-white p-2 shadow-lg">
                {sellers.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-500">No sellers found</p>
                )}
                {sellers.map((seller) => {
                  const checked = sellerFilter.includes(seller.slug);
                  return (
                    <label key={seller.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-muted-50">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          toggleSeller(seller.slug);
                        }}
                        className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary/20"
                      />
                      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-muted-100">
                        <ImageWithFallback
                          src={resolveImage(seller.logo_url || '/images/placeholder.webp')}
                          alt={seller.name}
                          width={28}
                          height={28}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-secondary-800">{seller.name}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Offer type filter */}
          <div className="flex items-center gap-2 rounded-lg border border-muted-200 px-3 py-2">
            <span className="text-xs font-medium text-muted-500">Type:</span>
            {(
              [
                { key: 'featured' as const, label: 'Featured', icon: Star },
                { key: 'isNew' as const, label: 'New', icon: Sparkles },
                { key: 'discounted' as const, label: 'Discounted', icon: BadgePercent },
              ]
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleType(key)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  typeFilter[key]
                    ? 'bg-primary text-white'
                    : 'bg-muted-100 text-muted-600 hover:bg-muted-200'
                )}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setParam('status', e.target.value === 'all' ? null : e.target.value)}
            className="rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-800 focus:border-primary focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {activeFilterCount > 0 && (
            <>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Filters Applied: {activeFilterCount}
              </span>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:text-danger-600"
              >
                <RotateCcw size={14} />
                Reset All
              </button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100">
                <th className="pb-3 font-medium text-muted-500">Product</th>
                <th className="hidden pb-3 font-medium text-muted-500 md:table-cell">Seller</th>
                <th className="hidden pb-3 font-medium text-muted-500 lg:table-cell">Price</th>
                <th className="pb-3 font-medium text-muted-500">Featured</th>
                <th className="pb-3 font-medium text-muted-500">New</th>
                <th className="pb-3 font-medium text-muted-500">Discount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-muted-50/50">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted-100">
                        <ImageWithFallback
                          src={resolveImage(product.images?.[0])}
                          alt={product.name}
                          width={60}
                          height={60}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-secondary-800">{product.name}</p>
                        <p className="truncate text-xs text-muted-500">
                          {product.categories?.name || 'Uncategorized'}
                          {product.sku ? ` • ${product.sku}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden py-3 md:table-cell">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted-100 px-2.5 py-1 text-xs font-medium text-secondary-700">
                      <Store size={13} className="text-muted-400" />
                      {sellerName(product.vendors)}
                    </span>
                  </td>
                  <td className="hidden py-3 lg:table-cell">
                    <p className="font-medium text-secondary-800">{formatPrice(product.price)}</p>
                    {product.discount_price != null && (
                      <p className="text-xs text-success">{formatPrice(product.discount_price)}</p>
                    )}
                  </td>
                  <td className="py-3">
                    <Toggle
                      checked={product.is_featured}
                      loading={saving?.id === product.id && saving?.field === 'is_featured'}
                      onChange={(v) => saveField(product.id, 'is_featured', v)}
                    />
                  </td>
                  <td className="py-3">
                    <Toggle
                      checked={product.is_new}
                      loading={saving?.id === product.id && saving?.field === 'is_new'}
                      onChange={(v) => saveField(product.id, 'is_new', v)}
                    />
                  </td>
                  <td className="py-3">
                    {justSaved === product.id ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <Check className="h-4 w-4" /> Saved
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-500">Rs.</span>
                          <input
                            type="number"
                            min={0}
                            defaultValue={product.discount_price ?? ''}
                            placeholder="0"
                            onBlur={(e) => {
                              const val = e.target.value === '' ? null : Number(e.target.value);
                              if (val !== product.discount_price) {
                                saveField(product.id, 'discount_price', val);
                              }
                            }}
                            className="w-28 rounded-lg border border-muted-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                            aria-label={`Discount price for ${product.name}`}
                          />
                        </div>
                        {saving?.id === product.id && saving?.field === 'discount_price' && (
                          <Save className="h-4 w-4 animate-pulse text-primary" />
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-500">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
                    Loading products
                  </td>
                </tr>
              )}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-500">
                    No products match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={PAGE_SIZE}
          itemLabel="products"
          variant="table"
        />
      </div>
    </div>
  );
}

function Toggle({
  checked,
  loading,
  onChange,
}: {
  checked: boolean;
  loading?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={loading}
      onClick={() => onChange(!checked)}
      // 44px hit area (p-2 + 24px track) so the switch is tappable on a phone
      // without the visible track growing to 44px.
      className={cn(
        'flex h-11 w-[60px] shrink-0 cursor-pointer items-center p-2',
        loading && 'opacity-50'
      )}
    >
      <span
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-300'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </span>
    </button>
  );
}