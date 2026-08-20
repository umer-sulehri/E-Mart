'use client';

import React from 'react';
import Link from 'next/link';
import { useOrders, useOrderTracking, useCancelOrder } from '@/hooks/useOrders';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon, CheckCircleIcon, ClockIcon } from '@/components/icons';

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const;

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <OrderDetailPageInner params={params} />;
}

function OrderDetailPageInner({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = React.useState('');
  React.useEffect(() => { params.then((p) => setId(p.id)); }, [params]);

  const { data: ordersData, isLoading: ordersLoading } = useOrders();
  const { data: tracking, isLoading: trackingLoading } = useOrderTracking(id);
  const cancelOrder = useCancelOrder();

  const orders = ordersData?.orders ?? [];
  const order = orders.find((o) => o.id === id);

  const isLoading = ordersLoading || trackingLoading;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-surface-alt rounded-full" />
            <div className="space-y-2">
              <div className="h-6 bg-surface-alt rounded w-48" />
              <div className="h-4 bg-surface-alt rounded w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6"><div className="h-32 bg-surface-alt rounded" /></Card>
              <Card className="p-6"><div className="h-40 bg-surface-alt rounded" /></Card>
            </div>
            <div className="space-y-4">
              <Card className="p-5"><div className="h-24 bg-surface-alt rounded" /></Card>
              <Card className="p-5"><div className="h-16 bg-surface-alt rounded" /></Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-lg text-text-secondary">Order not found</p>
        <Link href="/user/orders" className="text-sm font-semibold text-primary-dark hover:underline mt-4 inline-block">
          View all orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = statusSteps.indexOf(order.status as typeof statusSteps[number]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/user/orders" className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full hover:bg-surface transition-colors">
          <ArrowLeftIcon className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Order #{order.orderNumber}</h1>
          <p className="text-sm text-text-secondary">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Status Tracker */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">Order Status</h2>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
              <div
                className="absolute top-5 left-0 h-0.5 bg-primary transition-all"
                style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
              />
              {statusSteps.map((step, i) => {
                const isCompleted = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isCompleted ? 'bg-primary border-primary text-text-inverse' : 'bg-bg border-border text-text-secondary'
                    }`}>
                      {isCompleted ? <CheckCircleIcon className="w-5 h-5" /> : <ClockIcon className="w-5 h-5" />}
                    </div>
                    <span className={`text-xs font-medium ${isCurrent ? 'text-primary-dark' : 'text-text-secondary'}`}>
                      {step.charAt(0).toUpperCase() + step.slice(1)}
                    </span>
                  </div>
                );
              })}
            </div>
            {order.estimatedDelivery && (
              <p className="text-sm text-text-secondary mt-4">
                Estimated delivery: <span className="font-semibold text-text-primary">{order.estimatedDelivery}</span>
              </p>
            )}
          </Card>

          {/* Tracking History */}
          {tracking && tracking.history.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-text-primary mb-4">Tracking History</h2>
              <div className="flex flex-col gap-3">
                {tracking.history.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-text-primary capitalize">{entry.status}</p>
                      <p className="text-xs text-text-secondary">
                        {new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Items */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Order Items</h2>
            <div className="flex flex-col gap-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-bg rounded-[10px]">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded-[8px] bg-surface-alt flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary line-clamp-1">{item.productName}</p>
                    <p className="text-xs text-text-secondary mt-1">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold text-text-primary flex-shrink-0">
                    Rs {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Payment */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wide">Payment</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Method</span>
                <span className="font-medium text-text-primary capitalize">{order.paymentMethod.replace('cod', 'Cash on Delivery')}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-text-secondary">Total</span>
                <span className="font-bold text-text-primary">Rs {order.total.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Delivery Address */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wide">Delivery Address</h3>
            <p className="text-sm text-text-secondary">{order.address}</p>
          </Card>

          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <Button
              variant="danger"
              className="w-full"
              onClick={() => cancelOrder.mutate(order.id)}
              disabled={cancelOrder.isPending}
            >
              {cancelOrder.isPending ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
