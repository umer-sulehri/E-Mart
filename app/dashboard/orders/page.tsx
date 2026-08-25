'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, Truck, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import type { Order, OrderItem } from '@/types';

type FilterStatus = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const tabs: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'primary' | 'danger'> = {
  delivered: 'success',
  processing: 'warning',
  shipped: 'primary',
  cancelled: 'danger',
  pending: 'warning',
  confirmed: 'primary',
  out_for_delivery: 'primary',
  returned: 'danger',
  refunded: 'warning',
};

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 10;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: perPage.toString(),
        });
        if (activeTab !== 'all') {
          params.set('status', activeTab);
        }

        const res = await fetch(`/api/v1/orders?${params.toString()}`);
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.success) {
          setOrders(data.data || []);
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
    };

    fetchOrders();
  }, [currentPage, activeTab, router, isAuthenticated]);

  const handleTabChange = (tab: FilterStatus) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const getOrderItems = (order: Order): OrderItem[] => {
    return (order as unknown as { order_items?: OrderItem[] }).order_items || order.items || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-secondary-800">My Orders</h2>
        {!loading && totalItems > 0 && (
          <p className="text-sm text-muted-500">{totalItems} order{totalItems !== 1 ? 's' : ''}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.value
                ? 'bg-primary text-white'
                : 'text-muted-600 hover:bg-muted-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton variant="text" width={150} />
                  <Skeleton variant="text" width={100} />
                </div>
                <Skeleton variant="text" width={80} />
              </div>
              <div className="mt-4 flex gap-2">
                <Skeleton variant="rectangle" width={56} height={56} />
                <Skeleton variant="rectangle" width={56} height={56} />
                <Skeleton variant="rectangle" width={56} height={56} />
              </div>
              <div className="mt-4 border-t border-muted-100 pt-4">
                <div className="flex items-center justify-between">
                  <Skeleton variant="text" width={120} />
                  <Skeleton variant="text" width={140} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-muted-300" />
          <p className="mt-4 text-lg font-semibold text-secondary-800">
            No orders found
          </p>
          <p className="mt-1 text-sm text-muted-500">
            {activeTab === 'all'
              ? "You haven't placed any orders yet."
              : `No ${activeTab} orders.`}
          </p>
          <Link href="/products">
            <Button variant="primary" className="mt-4">
              Start Shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const items = getOrderItems(order);
            return (
              <div
                key={order.id}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-secondary-800">
                      {order.orderNumber}
                    </p>
                    <p className="text-sm text-muted-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <Badge variant={statusVariant[order.status] ?? 'warning'}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {items.slice(0, 3).map((item, i) => (
                    <div
                      key={item.id || i}
                      className="relative h-14 w-14 overflow-hidden rounded-lg border border-muted-200 bg-muted-50"
                    >
                      <Image
                        src={item.productImage || '/images/placeholder.png'}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                  {items.length > 3 && (
                    <span className="text-sm text-muted-500">
                      +{items.length - 3} more
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-muted-100 pt-4">
                  <p className="font-bold text-secondary-800">
                    {formatPrice(order.total)}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                    {order.status === 'shipped' && (
                      <Button variant="ghost" size="sm">
                        <Truck className="h-4 w-4" />
                        Track
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                    currentPage === page
                      ? 'bg-primary text-white'
                      : 'text-muted-600 hover:bg-muted-100'
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
