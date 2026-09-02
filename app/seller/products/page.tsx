'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const statusVariant: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  inactive: 'warning',
};

function SkeletonRow() {
  return (
    <tr className="border-b border-muted-50">
      <td className="px-6 py-4"><div className="h-4 w-4 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-muted-200" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted-200" />
        </div>
      </td>
      <td className="px-6 py-4"><div className="h-4 w-16 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-20 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-10 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-16 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-16 animate-pulse rounded bg-muted-200" /></td>
    </tr>
  );
}

export default function SellerProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const ITEMS_PER_PAGE = 10;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(ITEMS_PER_PAGE));
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/v1/seller/products?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setTotalPages(data.meta?.totalPages || 1);
        setTotalItems(data.meta?.totalItems || 0);
      } else {
        toast.error(data.error || 'Failed to load products');
      }
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchChange = (value: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this product?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/v1/seller/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Product deactivated');
        fetchProducts();
      } else {
        toast.error(data.error || 'Failed to delete product');
      }
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  const startItem = (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(page * ITEMS_PER_PAGE, totalItems);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-800">Products</h2>
          <p className="text-sm text-muted-500">Manage your product inventory</p>
        </div>
        <Link href="/seller/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add New Product
          </Button>
        </Link>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              placeholder="Search products by name or SKU..."
              defaultValue={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-600">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100 bg-muted-50">
                <th className="px-6 py-3 font-medium text-muted-600">Product</th>
                <th className="px-6 py-3 font-medium text-muted-600">SKU</th>
                <th className="px-6 py-3 font-medium text-muted-600">Price</th>
                <th className="px-6 py-3 font-medium text-muted-600">Stock</th>
                <th className="px-6 py-3 font-medium text-muted-600">Status</th>
                <th className="px-6 py-3 font-medium text-muted-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : products.length === 0
                  ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <Package className="mx-auto mb-3 h-10 w-10 text-muted-300" />
                          <p className="text-sm text-muted-500">No products found</p>
                        </td>
                      </tr>
                    )
                  : products.map((product) => (
                      <tr key={product.id} className="border-b border-muted-50 transition-colors hover:bg-muted-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="dashboard-image-cell h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted-100">
                              {product.images?.[0] ? (
                                <ImageWithFallback src={product.images[0]} alt={product.name} width={60} height={60} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-secondary-800">{product.name}</span>
                              <p className="text-xs text-muted-500">{product.category?.name ?? product.categories?.name ?? ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-600">{product.sku}</td>
                        <td className="px-6 py-4">
                          <div>
                            {product.discount_price ? (
                              <>
                                <span className="font-semibold text-secondary-800">{formatPrice(product.discount_price)}</span>
                                <span className="ml-1.5 text-xs text-muted-400 line-through">{formatPrice(product.price)}</span>
                              </>
                            ) : (
                              <span className="font-semibold text-secondary-800">{formatPrice(product.price)}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn('font-medium', product.stock_quantity === 0 ? 'text-danger' : 'text-secondary-800')}>
                            {product.stock_quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={product.is_active ? 'success' : 'warning'}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/seller/products/${product.id}/edit`)}
                              className="rounded-lg p-2 text-muted-600 transition-colors hover:bg-primary-50 hover:text-primary"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              disabled={deleting === product.id}
                              className="rounded-lg p-2 text-muted-600 transition-colors hover:bg-danger-50 hover:text-danger disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-muted-100 px-6 py-4">
            <p className="text-sm text-muted-500">
              {totalItems > 0 ? `Showing ${startItem} to ${endItem} of ${totalItems} products` : 'No results'}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-muted-200 p-2 text-muted-600 transition-colors hover:bg-muted-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page + i - 2;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                      p === page
                        ? 'bg-primary text-white'
                        : 'text-muted-600 hover:bg-muted-50'
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-muted-200 p-2 text-muted-600 transition-colors hover:bg-muted-50 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
