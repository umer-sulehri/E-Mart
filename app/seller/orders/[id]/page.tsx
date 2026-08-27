'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ChevronLeft, Package } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import OrderTimeline from '@/components/ui/OrderTimeline';
import { formatPrice, formatDate } from '@/lib/utils';

const statusVariant: Record<string, 'success' | 'warning' | 'primary' | 'danger' | 'default'> = {
  delivered: 'success',
  processing: 'warning',
  shipped: 'primary',
  out_for_delivery: 'primary',
  confirmed: 'primary',
  cancelled: 'danger',
  pending: 'default',
};

const TIMELINE_STEPS = [
  { status: 'pending', label: 'Order Placed' },
  { status: 'confirmed', label: 'Order Confirmed' },
  { status: 'processing', label: 'Processing' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'out_for_delivery', label: 'Out for Delivery' },
  { status: 'delivered', label: 'Delivered' },
];

function SkeletonBlock({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted-200 ${className}`} />;
}

export default function SellerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/v1/seller/orders/${id}`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.data);
        } else {
          toast.error(data.error || 'Failed to load order');
        }
      } catch {
        toast.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchOrder();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/v1/seller/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Order status updated');
        setOrder((prev: any) => ({ ...prev, status: newStatus }));
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/seller/orders')}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <SkeletonBlock className="h-8 w-48" />
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <SkeletonBlock className="h-8 w-1/2" />
            <SkeletonBlock className="h-4 w-1/3" />
            <SkeletonBlock className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-12 text-center">
        <Package className="mx-auto mb-3 h-12 w-12 text-muted-300" />
        <p className="text-sm text-muted-500">Order not found</p>
        <Link href="/seller/orders" className="mt-3 inline-block text-sm font-medium text-primary hover:text-primary-500">
          Back to Orders
        </Link>
      </div>
    );
  }

  const items = order.order_items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/seller/orders')}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-secondary-800">Order {order.order_number}</h2>
            <p className="text-sm text-muted-500">Placed on {formatDate(order.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[order.status] ?? 'default'}>
            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
          </Badge>
          <select
            value={order.status}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            disabled={updating}
            className="rounded-lg border border-muted-200 bg-white px-2 py-1.5 text-xs text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Order items */}
        <div className="rounded-xl bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-muted-100 p-6">
            <h3 className="text-lg font-bold text-secondary-800">Order Items</h3>
          </div>
          <div className="divide-y divide-muted-50">
            {items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 p-6">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted-100">
                  {item.products?.images?.[0] && (
                    <Image
                      src={item.products.images[0]}
                      alt={item.products?.name || 'Product'}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-secondary-800 line-clamp-1">
                    {item.products?.name || 'Product'}
                  </p>
                  <p className="text-xs text-muted-500">
                    {item.products?.sku || 'N/A'} · Qty: {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-secondary-800">
                  {formatPrice(item.total_price)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-muted-100 px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-500">Total</span>
              <span className="text-lg font-bold text-secondary-800">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Customer + Status sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-secondary-800">Customer</h3>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-muted-500">Name</span>
                <span className="font-medium text-secondary-800">
                  {order.profiles?.first_name} {order.profiles?.last_name}
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-500">Email</span>
                <span className="font-medium text-secondary-800">{order.profiles?.email}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-muted-500">Payment</span>
                <span className="font-medium text-secondary-800 capitalize">
                  {order.payment_method || 'N/A'}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-secondary-800">Order Timeline</h3>
            <OrderTimeline
              steps={TIMELINE_STEPS}
              currentStatus={order.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
