'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import { cn, formatPrice, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import ExportCsvButton from '@/components/ui/ExportCsvButton';

type OrderStatusType = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const statusConfig: Record<OrderStatusType, { variant: 'warning' | 'primary' | 'secondary' | 'outline' | 'success' | 'danger' }> = {
  pending: { variant: 'warning' },
  confirmed: { variant: 'primary' },
  processing: { variant: 'secondary' },
  shipped: { variant: 'outline' },
  delivered: { variant: 'success' },
  cancelled: { variant: 'danger' },
};

function SkeletonRow() {
  return (
    <tr className="border-b border-muted-50">
      <td className="py-3 pr-4"><div className="h-4 w-4 animate-pulse rounded bg-muted-200" /></td>
      <td className="py-3"><div className="h-4 w-28 animate-pulse rounded bg-muted-200" /></td>
      <td className="hidden py-3 md:table-cell"><div className="h-4 w-24 animate-pulse rounded bg-muted-200" /></td>
      <td className="hidden py-3 md:table-cell"><div className="h-4 w-10 animate-pulse rounded bg-muted-200" /></td>
      <td className="py-3"><div className="h-4 w-20 animate-pulse rounded bg-muted-200" /></td>
      <td className="py-3"><div className="h-4 w-20 animate-pulse rounded bg-muted-200" /></td>
      <td className="hidden py-3 lg:table-cell"><div className="h-4 w-24 animate-pulse rounded bg-muted-200" /></td>
      <td className="py-3"><div className="h-4 w-10 animate-pulse rounded bg-muted-200" /></td>
    </tr>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const itemsPerPage = 12;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', String(itemsPerPage));
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/v1/admin/orders?${params}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setTotalPages(data.meta?.totalPages || 1);
        setTotalItems(data.meta?.totalItems || 0);
      } else {
        toast.error(data.error || 'Failed to load orders');
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchChange = (value: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearch(value);
      setCurrentPage(1);
    }, 400);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatusType) => {
    try {
      const res = await fetch(`/api/v1/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Order marked as ${newStatus}`);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Orders Management</h1>
          <p className="text-sm text-muted-500">Track and manage all marketplace orders</p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
            <input
              type="text"
              placeholder="Search by order ID..."
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
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ExportCsvButton url="/api/v1/admin/export/orders" />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100">
                <th className="pb-3 font-medium text-muted-500">Order ID</th>
                <th className="hidden pb-3 font-medium text-muted-500 md:table-cell">Customer</th>
                <th className="hidden pb-3 font-medium text-muted-500 md:table-cell">Items</th>
                <th className="pb-3 font-medium text-muted-500">Total</th>
                <th className="pb-3 font-medium text-muted-500">Status</th>
                <th className="hidden pb-3 font-medium text-muted-500 lg:table-cell">Date</th>
                <th className="pb-3 font-medium text-muted-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-50">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : orders.map((order: any) => {
                    const status = order.status as OrderStatusType;
                    const cfg = statusConfig[status] || { variant: 'default' as const };
                    return (
                      <tr key={order.id} className="hover:bg-muted-50/50">
                        <td className="py-3 font-medium text-primary">{order.order_number}</td>
                        <td className="hidden py-3 text-secondary-800 md:table-cell">
                          {order.profiles?.first_name} {order.profiles?.last_name}
                        </td>
                        <td className="hidden py-3 text-secondary-800 md:table-cell">
                          {order.order_items?.length ?? 0}
                        </td>
                        <td className="py-3 font-medium text-secondary-800">
                          {formatPrice(order.total)}
                        </td>
                        <td className="py-3">
                          <Badge variant={cfg.variant} size="sm">
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                          </Badge>
                        </td>
                        <td className="hidden whitespace-nowrap py-3 text-muted-600 lg:table-cell">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-3">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value as OrderStatusType)
                            }
                            className="rounded-lg border border-muted-200 bg-white px-2 py-1.5 text-xs font-medium text-secondary-700 focus:border-primary focus:outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-500">
              {totalItems > 0 ? `Showing ${startItem} to ${endItem} of ${totalItems}` : 'No results'}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-muted-200 p-2 text-muted-600 transition-colors hover:bg-muted-50 disabled:opacity-50"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={cn(
                      'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                      currentPage === p
                        ? 'bg-primary text-white'
                        : 'border border-muted-200 text-muted-600 hover:bg-muted-50'
                    )}
                  >
                    {p}
                  </button>
                );
              })}
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
