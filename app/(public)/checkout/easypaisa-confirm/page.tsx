'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Loader2,
  ShoppingBag,
  Eye,
  ArrowRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';

function EasypaisaConfirmContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const status = searchParams.get('status') || 'pending';

  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isSuccess = status === 'success';
  const isFailed = status === 'failed' || status === 'cancelled';

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/v1/orders/${orderId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setOrderDetails(json.data);
        }
      } catch {}
      setLoading(false);
    }

    fetchOrder();
  }, [orderId]);

  return (
    <section className="py-16">
      <div className="container mx-auto max-w-lg px-4 sm:px-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center py-12">
              <Loader2 size={48} className="animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-500">Verifying payment...</p>
            </div>
          ) : isSuccess ? (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                <CheckCircle size={48} className="text-success" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-secondary-800">
                Payment Successful!
              </h1>
              <p className="mt-3 text-sm text-muted-500">
                Your Easypaisa payment has been processed successfully. Thank you for your order!
              </p>

              {orderId && (
                <div className="mt-6 rounded-xl bg-muted-50 p-4">
                  <p className="text-xs text-muted-500">Order Number</p>
                  <p className="mt-1 font-heading text-lg font-bold text-secondary-800">
                    {orderId}
                  </p>
                </div>
              )}

              {orderDetails && (
                <div className="mt-4 rounded-xl bg-muted-50 p-4 text-left">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-500">Order Details</p>
                  <div className="space-y-1 text-sm text-secondary-700">
                    {orderDetails.total != null && (
                      <div className="flex justify-between">
                        <span>Total</span>
                        <span className="font-semibold">PKR {orderDetails.total.toLocaleString()}</span>
                      </div>
                    )}
                    {orderDetails.payment_method && (
                      <div className="flex justify-between">
                        <span>Payment</span>
                        <span>Easypaisa</span>
                      </div>
                    )}
                    {orderDetails.status && (
                      <div className="flex justify-between">
                        <span>Status</span>
                        <span className="capitalize">{orderDetails.status}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/dashboard/orders">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <Eye size={16} />
                    View Order
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    <ShoppingBag size={16} />
                    Continue Shopping
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </>
          ) : isFailed ? (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-danger/10">
                <XCircle size={48} className="text-danger" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-secondary-800">
                Payment Failed
              </h1>
              <p className="mt-3 text-sm text-muted-500">
                Your Easypaisa payment could not be processed. Please try again or use a different payment method.
              </p>

              {orderId && (
                <div className="mt-6 rounded-xl bg-muted-50 p-4">
                  <p className="text-xs text-muted-500">Order Number</p>
                  <p className="mt-1 font-heading text-lg font-bold text-secondary-800">
                    {orderId}
                  </p>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/checkout">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    Retry Payment
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-warning/10">
                <Loader2 size={48} className="text-warning" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-secondary-800">
                Payment Pending
              </h1>
              <p className="mt-3 text-sm text-muted-500">
                Your payment is being processed. Please wait a moment.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/dashboard/orders">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Check Order Status
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default function EasypaisaConfirmPage() {
  return (
    <Suspense>
      <EasypaisaConfirmContent />
    </Suspense>
  );
}
