'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import toast from 'react-hot-toast';
import {
  Search,
  Package,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Eye,
  Flag,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import ExportCsvButton from '@/components/ui/ExportCsvButton';

function SkeletonRow() {
  return (
    <tr className="border-b border-muted-50">
      <td className="py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-muted-200" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted-200" />
        </div>
      </td>
      <td className="hidden py-3 md:table-cell"><div className="h-4 w-24 animate-pulse rounded bg-muted-200" /></td>
      <td className="hidden py-3 lg:table-cell"><div className="h-4 w-20 animate-pulse rounded bg-muted-200" /></td>
      <td className="py-3"><div className="h-4 w-16 animate-pulse rounded bg-muted-200" /></td>
      <td className="hidden py-3 lg:table-cell"><div className="h-4 w-10 animate-pulse rounded bg-muted-200" /></td>
      <td className="py-3"><div className="h-4 w-16 animate-pulse rounded bg-muted-200" /></td>
      <td className="py-3"><div className="h-4 w-16 animate-pulse rounded bg-muted-200" /></td>
    </tr>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [moderating, setModerating] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const itemsPerPage = 15;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', String(itemsPerPage));
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/v1/admin/products?${params}`);
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
  }, [currentPage, search, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchChange = (value: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearch(value);
      setCurrentPage(1);
    }, 400);
  };

  const handleModeration = async (productId: string, status: string) => {
    setModerating(productId);
    try {
      const res = await fetch(`/api/v1/admin/products/${productId}/moderation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderationStatus: status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Product ${status}`);
        fetchProducts();
      } else {
        toast.error(data.error || 'Failed to moderate product');
      }
    } catch {
      toast.error('Failed to moderate product');
    } finally {
      setModerating(null);
    }
  };

  const getModerationStatus = (product: any) => {
    if (product.moderation_status === 'flagged') return <Badge variant="danger" size="sm">Flagged</Badge>;
    if (product.moderation_status === 'removed') return <Badge variant="danger" size="sm">Removed</Badge>;
    if (product.is_active) return <Badge variant="success" size="sm">Active</Badge>;
    return <Badge variant="default" size="sm">Inactive</Badge>;
  };

  const flaggedCount = products.filter((p) => p.moderation_status === 'flagged').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">Products Management</h1>
        <p className="text-sm text-muted-500">Moderate and manage all seller products</p>
      </div>

      {flaggedCount > 0 && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <div>
              <p className="font-medium text-secondary-800">{flaggedCount} products flagged for moderation</p>
              <p className="text-sm text-muted-600">Review flagged products for policy violations</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
            <input
              type="text"
              placeholder="Search products..."
              defaultValue={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-muted-200 bg-white py-2 pl-10 pr-4 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-700 focus:border-primary focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ExportCsvButton url="/api/v1/admin/export/products" />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100">
                <th className="pb-3 font-medium text-muted-500">Product</th>
                <th className="hidden pb-3 font-medium text-muted-500 md:table-cell">Seller</th>
                <th className="hidden pb-3 font-medium text-muted-500 lg:table-cell">Category</th>
                <th className="pb-3 font-medium text-muted-500">Price</th>
                <th className="hidden pb-3 font-medium text-muted-500 lg:table-cell">Stock</th>
                <th className="pb-3 font-medium text-muted-500">Status</th>
                <th className="pb-3 font-medium text-muted-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : products.map((product: any) => (
                    <tr key={product.id} className="hover:bg-muted-50/50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="dashboard-image-cell h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted-100">
                            {product.images?.[0] ? (
                              <ImageWithFallback src={product.images[0]} alt={product.name} width={60} height={60} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-muted-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-secondary-800">{product.name}</p>
                            <p className="truncate text-xs text-muted-500 md:hidden">
                              {product.vendors?.name ?? product.profiles?.first_name ?? ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden py-3 text-secondary-800 md:table-cell">
                        {product.vendors?.name ?? `${product.profiles?.first_name ?? ''} ${product.profiles?.last_name ?? ''}`}
                      </td>
                      <td className="hidden py-3 text-muted-600 lg:table-cell">
                        {product.categories?.name ?? '-'}
                      </td>
                      <td className="py-3 font-medium text-secondary-800">{formatPrice(product.price)}</td>
                      <td className="hidden py-3 lg:table-cell">
                        <span className={cn('font-medium', (product.stock_quantity ?? 0) < 20 ? 'text-danger' : 'text-secondary-800')}>
                          {product.stock_quantity ?? 0}
                        </span>
                      </td>
                      <td className="py-3">{getModerationStatus(product)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          {(!product.moderation_status || product.moderation_status === 'pending' || product.moderation_status === 'flagged') && (
                            <button
                              onClick={() => handleModeration(product.id, 'approved')}
                              disabled={moderating === product.id}
                              className="rounded p-1.5 text-muted-500 transition-colors hover:bg-success-50 hover:text-success disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          {product.moderation_status !== 'flagged' && product.is_active && (
                            <button
                              onClick={() => handleModeration(product.id, 'flagged')}
                              disabled={moderating === product.id}
                              className="rounded p-1.5 text-muted-500 transition-colors hover:bg-warning-50 hover:text-warning disabled:opacity-50"
                              title="Flag"
                            >
                              <Flag className="h-4 w-4" />
                            </button>
                          )}
                          {product.moderation_status !== 'removed' && (
                            <button
                              onClick={() => handleModeration(product.id, 'removed')}
                              disabled={moderating === product.id}
                              className="rounded p-1.5 text-muted-500 transition-colors hover:bg-danger-50 hover:text-danger disabled:opacity-50"
                              title="Remove"
                            >
                              <ShieldAlert className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-500">
              Page {currentPage} of {totalPages} ({totalItems} products)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-muted-200 p-2 text-muted-600 transition-colors hover:bg-muted-50 disabled:opacity-50"
              >
                ← Prev
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-muted-200 p-2 text-muted-600 transition-colors hover:bg-muted-50 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
