'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Eye, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type OrderTab = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const tabs: { key: OrderTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'primary' | 'danger' | 'default'> = {
  delivered: 'success',
  processing: 'warning',
  shipped: 'primary',
  out_for_delivery: 'primary',
  confirmed: 'primary',
  cancelled: 'danger',
  pending: 'default',
};

function SkeletonRow() {
  return (
    <tr className="border-b border-muted-50">
      <td className="px-6 py-4"><div className="h-4 w-28 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-16 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-20 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-20 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-24 animate-pulse rounded bg-muted-200" /></td>
    </tr>
  );
}

export default function SellerOrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(ITEMS_PER_PAGE));
      if (activeTab !== 'all') params.set('status', activeTab);

      const res = await fetch(`/api/v1/seller/orders?${params}`);
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
  }, [page, activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/v1/seller/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Order status updated');
        fetchOrders();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const startItem = (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(page * ITEMS_PER_PAGE, totalItems);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary-800">Orders</h2>
        <p className="text-sm text-muted-500">Manage and fulfill customer orders</p>
      </div>

      <div className="rounded-xl bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-primary text-white'
                  : 'text-muted-600 hover:bg-muted-50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100 bg-muted-50">
                <th className="px-6 py-3 font-medium text-muted-600">Order ID</th>
                <th className="px-6 py-3 font-medium text-muted-600">Customer</th>
                <th className="px-6 py-3 font-medium text-muted-600">Items</th>
                <th className="px-6 py-3 font-medium text-muted-600">Total</th>
                <th className="px-6 py-3 font-medium text-muted-600">Status</th>
                <th className="px-6 py-3 font-medium text-muted-600">Date</th>
                <th className="px-6 py-3 font-medium text-muted-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : orders.length === 0
                  ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <Package className="mx-auto mb-3 h-10 w-10 text-muted-300" />
                          <p className="text-sm text-muted-500">No orders found</p>
                        </td>
                      </tr>
                    )
                  : orders.map((order: any) => (
                      <tr key={order.id} className="border-b border-muted-50 transition-colors hover:bg-muted-50/50">
                        <td className="px-6 py-4 font-medium text-secondary-800">
                          {order.order_number}
                        </td>
                        <td className="px-6 py-4 text-muted-600">
                          {order.profiles?.first_name} {order.profiles?.last_name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-muted-600">{order.order_items?.length ?? 0} items</span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-secondary-800">
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={statusVariant[order.status] ?? 'default'}>
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-600">{formatDate(order.created_at)}</td>
                        <td className="px-6 py-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                            disabled={updatingId === order.id}
                            className="rounded-lg border border-muted-200 bg-white px-2 py-1.5 text-xs text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-muted-100 px-6 py-4">
            <p className="text-sm text-muted-500">
              {totalItems > 0 ? `Showing ${startItem} to ${endItem} of ${totalItems} orders` : 'No results'}
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
                      p === page ? 'bg-primary text-white' : 'text-muted-600 hover:bg-muted-50'
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
