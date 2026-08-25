'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Package,
  Truck,
  MapPin,
  CreditCard,
  RotateCcw,
  Download,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatPrice, formatDate, cn } from '@/lib/utils';
import type { Order, OrderItem, Address } from '@/types';

const allTimelineSteps = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

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

const paymentMethodLabel: Record<string, string> = {
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  paypal: 'PayPal',
  stripe: 'Stripe',
  cash_on_delivery: 'Cash on Delivery',
  bank_transfer: 'Bank Transfer',
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/orders/${orderId}`);
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.success) {
          setOrder(data.data);
        } else {
          toast.error(data.error || 'Order not found');
        }
      } catch {
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  const handleCancel = async () => {
    if (!order) return;
    const confirmed = window.confirm('Are you sure you want to cancel this order?');
    if (!confirmed) return;

    try {
      setCancelling(true);
      const res = await fetch(`/api/v1/orders/${order.id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Order cancelled successfully');
        setOrder({ ...order, status: 'cancelled' });
      } else {
        toast.error(data.error || 'Failed to cancel order');
      }
    } catch {
      toast.error('Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const getOrderItems = (ord: Order): OrderItem[] => {
    return (ord as unknown as { order_items?: OrderItem[] }).order_items || ord.items || [];
  };

  const getShippingAddress = (ord: Order): Address | null => {
    if (!ord.shippingAddress) return null;
    if (typeof ord.shippingAddress === 'string') {
      try {
        return JSON.parse(ord.shippingAddress) as Address;
      } catch {
        return null;
      }
    }
    return ord.shippingAddress as Address;
  };

  const getTimelineSteps = () => {
    if (!order) return [];
    const currentIdx = statusOrder.indexOf(order.status);
    if (currentIdx === -1) {
      return allTimelineSteps.map((s) => ({
        ...s,
        completed: false,
        current: s.key === order.status,
      }));
    }
    return allTimelineSteps.map((s) => {
      const stepIdx = statusOrder.indexOf(s.key);
      return {
        ...s,
        completed: stepIdx < currentIdx,
        current: stepIdx === currentIdx,
      };
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" width={140} height={20} />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton variant="text" width={200} height={28} />
              <Skeleton variant="text" width={140} />
            </div>
            <Skeleton variant="text" width={100} />
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <Skeleton variant="text" width={120} height={24} className="mb-6" />
          <div className="flex justify-between">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="circle" width={28} height={28} />
            ))}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm">
            <Skeleton variant="text" width={100} height={24} className="mb-4" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <Skeleton variant="rectangle" width={64} height={64} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="40%" />
                </div>
                <Skeleton variant="text" width={80} />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <Skeleton variant="rectangle" height={200} className="w-full" />
            <Skeleton variant="rectangle" height={150} className="w-full" />
            <Skeleton variant="rectangle" height={100} className="w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-600 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-muted-300" />
          <p className="mt-4 text-lg font-semibold text-secondary-800">Order not found</p>
          <Link href="/dashboard/orders">
            <Button variant="primary" className="mt-4">View All Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const items = getOrderItems(order);
  const shippingAddr = getShippingAddress(order);
  const timelineSteps = getTimelineSteps();
  const completedCount = timelineSteps.filter((s) => s.completed).length;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-600 transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-secondary-800">{order.orderNumber}</h2>
            <p className="text-sm text-muted-500">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge variant={statusVariant[order.status] ?? 'warning'} size="md">
            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-6 font-bold text-secondary-800">Order Timeline</h3>
        <div className="relative flex items-start justify-between">
          <div className="absolute left-0 top-3 h-0.5 w-full bg-muted-200" />
          <div
            className="absolute left-0 top-3 h-0.5 bg-primary transition-all"
            style={{
              width: `${
                timelineSteps.length > 1
                  ? (completedCount / (timelineSteps.length - 1)) * 100
                  : 0
              }%`,
            }}
          />
          {timelineSteps.map((step, i) => (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold',
                  step.completed
                    ? 'border-primary bg-primary text-white'
                    : step.current
                    ? 'border-primary bg-white text-primary'
                    : 'border-muted-300 bg-white text-muted-400'
                )}
              >
                {step.completed ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  'mt-2 whitespace-nowrap text-xs',
                  step.completed || step.current
                    ? 'font-medium text-secondary-800'
                    : 'text-muted-400'
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-secondary-800">Order Items</h3>
          <div className="divide-y divide-muted-100">
            {items.map((item, i) => (
              <div key={item.id || i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-muted-200 bg-muted-50">
                  <Image
                    src={item.productImage || '/images/placeholder.png'}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-secondary-800">
                    {item.productName}
                  </p>
                  <p className="text-xs text-muted-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-secondary-800">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-secondary-800">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-500">Subtotal</span>
                <span className="text-secondary-800">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-500">Shipping</span>
                <span className="text-secondary-800">
                  {order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-500">Tax</span>
                <span className="text-secondary-800">{formatPrice(order.tax)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-500">Discount</span>
                  <span className="text-success">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-muted-100 pt-3 font-bold">
                <span className="text-secondary-800">Total</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {shippingAddr && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-secondary-800">Shipping Address</h3>
              </div>
              <div className="text-sm text-muted-600 leading-relaxed">
                <p className="font-medium text-secondary-800">
                  {shippingAddr.firstName} {shippingAddr.lastName}
                </p>
                <p>{shippingAddr.addressLine1}</p>
                {shippingAddr.addressLine2 && <p>{shippingAddr.addressLine2}</p>}
                <p>
                  {shippingAddr.city}, {shippingAddr.state} {shippingAddr.postalCode}
                </p>
                <p className="mt-1">{shippingAddr.phone}</p>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-secondary-800">Payment</h3>
            </div>
            <p className="text-sm text-muted-600">
              {paymentMethodLabel[order.paymentMethod] || order.paymentMethod}
            </p>
            {order.trackingNumber && (
              <p className="mt-2 text-sm">
                <span className="text-muted-500">Tracking: </span>
                <span className="font-medium text-secondary-800">{order.trackingNumber}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <Button
            variant="danger"
            loading={cancelling}
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
            Cancel Order
          </Button>
        )}
        <Button variant="primary">
          <RotateCcw className="h-4 w-4" />
          Re-Order
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4" />
          Download Invoice
        </Button>
      </div>
    </div>
  );
}
