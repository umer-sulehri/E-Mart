'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { Order } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { CheckCircleIcon } from '@/components/icons';

/**
 * EasyPaisa redirect-back landing page. The gateway returns the customer
 * here after payment with the order id and transaction reference.
 */
function EasypaisaConfirmContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const ref = searchParams.get('ref');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => apiFetch<{ order: Order }>(`/orders/${orderId!}`).then((d) => d.order),
    enabled: !!orderId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-14 text-center">
        <span className="inline-block w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-14">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
          <CheckCircleIcon className="w-11 h-11 text-success" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Payment received</h1>
        <p className="text-text-secondary">
          Your EasyPaisa payment is being verified{ref ? <> (ref: <span className="font-semibold">{ref}</span>)</> : null}.
        </p>
        {order && (
          <p className="text-sm text-text-secondary mt-2">
            Order <span className="font-bold text-text-primary">{order.orderNumber}</span>
            {' '}· Rs {order.total.toLocaleString()}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href={order ? `/user/orders/${order.id}` : '/user/orders'}>
          <Button className="w-full" size="lg">
            View Order Status
          </Button>
        </Link>
        <Link href="/products">
          <Button className="w-full" size="lg" variant="ghost">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function EasypaisaConfirmPage() {
  return (
    <Suspense fallback={null}>
      <EasypaisaConfirmContent />
    </Suspense>
  );
}
