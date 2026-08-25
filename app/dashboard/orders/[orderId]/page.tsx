'use client';

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Check,
  Package,
  Truck,
  MapPin,
  CreditCard,
  RotateCcw,
  Download,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatPrice, formatDate, cn } from '@/lib/utils';

const timelineSteps = [
  { label: 'Order Placed', completed: true },
  { label: 'Processing', completed: true },
  { label: 'Shipped', completed: true, current: true },
  { label: 'Out for Delivery', completed: false },
  { label: 'Delivered', completed: false },
];

const mockOrder = {
  id: 'EM-2026-10482',
  date: '2026-08-20',
  status: 'shipped',
  trackingNumber: 'TRK-2026-88472',
  carrier: 'TCS Express',
  estimatedDelivery: '2026-08-28',
  items: [
    {
      name: 'Organic Bananas 1kg',
      image: '/images/products/banana.jpg',
      qty: 2,
      price: 450,
    },
    {
      name: 'Fresh Whole Milk 1L',
      image: '/images/products/milk.jpg',
      qty: 3,
      price: 280,
    },
    {
      name: 'Free-Range Eggs 12pc',
      image: '/images/products/eggs.jpg',
      qty: 1,
      price: 650,
    },
  ],
  shippingAddress: {
    firstName: 'Ahmed',
    lastName: 'Khan',
    addressLine1: '42 Liberty Avenue, Gulshan-e-Iqbal',
    addressLine2: 'Block 5, Near Safari Park',
    city: 'Karachi',
    state: 'Sindh',
    postalCode: '75300',
    phone: '+92 300 1234567',
  },
  paymentMethod: 'Cash on Delivery',
  subtotal: 2390,
  shipping: 0,
  tax: 359,
  total: 2749,
};

const statusVariant: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
  delivered: 'success',
  processing: 'warning',
  shipped: 'info',
  cancelled: 'danger',
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-600 transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      {/* Header */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-secondary-800">{mockOrder.id}</h2>
            <p className="text-sm text-muted-500">
              Placed on {formatDate(mockOrder.date)}
            </p>
          </div>
          <Badge variant={infoVariant(mockOrder.status)} size="md">
            {mockOrder.status.charAt(0).toUpperCase() + mockOrder.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-6 font-bold text-secondary-800">Order Timeline</h3>
        <div className="relative flex items-start justify-between">
          {/* Progress bar */}
          <div className="absolute left-0 top-3 h-0.5 w-full bg-muted-200" />
          <div
            className="absolute left-0 top-3 h-0.5 bg-primary transition-all"
            style={{
              width: `${
                ((timelineSteps.filter((s) => s.completed).length - 1) /
                  (timelineSteps.length - 1)) *
                100
              }%`,
            }}
          />
          {timelineSteps.map((step, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center">
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
        {/* Items */}
        <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-secondary-800">Order Items</h3>
          <div className="divide-y divide-muted-100">
            {mockOrder.items.map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-muted-200 bg-muted-50">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-secondary-800">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-500">Qty: {item.qty}</p>
                </div>
                <p className="text-sm font-semibold text-secondary-800">
                  {formatPrice(item.price * item.qty)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-secondary-800">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-500">Subtotal</span>
                <span className="text-secondary-800">
                  {formatPrice(mockOrder.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-500">Shipping</span>
                <span className="text-secondary-800">
                  {mockOrder.shipping === 0
                    ? 'Free'
                    : formatPrice(mockOrder.shipping)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-500">Tax</span>
                <span className="text-secondary-800">
                  {formatPrice(mockOrder.tax)}
                </span>
              </div>
              <div className="flex justify-between border-t border-muted-100 pt-3 font-bold">
                <span className="text-secondary-800">Total</span>
                <span className="text-primary">{formatPrice(mockOrder.total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-secondary-800">Shipping Address</h3>
            </div>
            <div className="text-sm text-muted-600 leading-relaxed">
              <p className="font-medium text-secondary-800">
                {mockOrder.shippingAddress.firstName}{' '}
                {mockOrder.shippingAddress.lastName}
              </p>
              <p>{mockOrder.shippingAddress.addressLine1}</p>
              {mockOrder.shippingAddress.addressLine2 && (
                <p>{mockOrder.shippingAddress.addressLine2}</p>
              )}
              <p>
                {mockOrder.shippingAddress.city},{' '}
                {mockOrder.shippingAddress.state}{' '}
                {mockOrder.shippingAddress.postalCode}
              </p>
              <p className="mt-1">{mockOrder.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-secondary-800">Payment Method</h3>
            </div>
            <p className="text-sm text-muted-600">{mockOrder.paymentMethod}</p>
            {mockOrder.trackingNumber && (
              <p className="mt-2 text-sm">
                <span className="text-muted-500">Tracking: </span>
                <span className="font-medium text-secondary-800">
                  {mockOrder.trackingNumber}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
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

function infoVariant(status: string) {
  const map: Record<string, 'success' | 'warning' | 'primary' | 'danger'> = {
    delivered: 'success',
    processing: 'warning',
    shipped: 'primary',
    cancelled: 'danger',
  };
  return map[status] ?? 'default';
}
