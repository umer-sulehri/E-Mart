'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { Order } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckCircleIcon } from '@/components/icons';

function buildInvoiceHtml(order: Order): string {
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${i.productName}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">Rs ${i.price.toLocaleString()}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">Rs ${(i.price * i.quantity).toLocaleString()}</td>
      </tr>`
    )
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${order.orderNumber}</title></head>
  <body style="font-family:Arial,sans-serif;max-width:700px;margin:32px auto;color:#222;">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #7a9b76;padding-bottom:12px;">
      <h1 style="margin:0;font-size:24px;">E-Mart</h1>
      <span style="font-size:13px;color:#666;">Invoice — ${new Date(order.createdAt).toLocaleDateString()}</span>
    </div>
    <p style="margin:16px 0 4px;"><strong>Order:</strong> ${order.orderNumber}</p>
    <p style="margin:0 0 4px;"><strong>Payment method:</strong> ${order.paymentMethod.toUpperCase()}</p>
    <p style="margin:0 0 16px;"><strong>Ship to:</strong> ${order.address}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead><tr>
        <th style="text-align:left;border-bottom:2px solid #222;padding:8px 0;">Item</th>
        <th style="text-align:center;border-bottom:2px solid #222;padding:8px 0;">Qty</th>
        <th style="text-align:right;border-bottom:2px solid #222;padding:8px 0;">Price</th>
        <th style="text-align:right;border-bottom:2px solid #222;padding:8px 0;">Total</th>
      </tr></thead>
      <tbody>${rows}
        <tr><td colspan="3" style="padding:12px 0;text-align:right;font-weight:bold;">Order total</td>
        <td style="padding:12px 0;text-align:right;font-weight:bold;font-size:16px;">Rs ${order.total.toLocaleString()}</td></tr>
      </tbody>
    </table>
    <p style="margin-top:32px;font-size:12px;color:#666;">Thank you for shopping with E-Mart.</p>
  </body></html>`;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => apiFetch<{ order: Order }>(`/orders/${orderId!}`).then((d) => d.order),
    enabled: !!orderId,
    retry: false,
  });

  const downloadInvoice = () => {
    if (!order) return;
    const blob = new Blob([buildInvoiceHtml(order)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `e-mart-invoice-${order.orderNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReceipt = () => {
    if (!order) return;
    const win = window.open('', '_blank', 'width=720,height=900');
    if (!win) return;
    win.document.write(buildInvoiceHtml(order));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const estimatedDelivery =
    order?.estimatedDelivery ??
    (order
      ? new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000).toDateString()
      : '');

  return (
    <div className="max-w-2xl mx-auto px-4 py-14">
      {isLoading && (
        <div className="flex flex-col items-center gap-4 py-20" aria-live="polite">
          <span className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-text-secondary">Loading your order…</p>
        </div>
      )}

      {!isLoading && (!orderId || error) && (
        <Card className="p-8 text-center">
          <p className="text-error font-semibold mb-3">
            {orderId
              ? 'We could not load this order. It may belong to a different account.'
              : 'No order reference found.'}
          </p>
          <Link href="/user/orders">
            <Button variant="outline">View My Orders</Button>
          </Link>
        </Card>
      )}

      {!isLoading && order && (
        <>
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center animate-[pop_0.45s_ease]" style={{ background: 'rgba(34,197,94,0.15)' }}>
              <CheckCircleIcon className="w-11 h-11 text-success" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Thank you for your order!</h1>
            <p className="text-text-secondary">
              Order <span className="font-bold text-text-primary">{order.orderNumber}</span> has been placed successfully.
            </p>
            {order.status !== 'delivered' && (
              <p className="text-sm text-text-secondary mt-2">
                Estimated delivery:{' '}
                <span className="font-semibold text-success">{estimatedDelivery}</span>
              </p>
            )}
          </div>

          <Card className="p-6 mb-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Order summary</h2>
            <ul className="flex flex-col gap-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 text-sm">
                  <span className="min-w-0 truncate text-text-primary">
                    {item.productName} <span className="text-text-secondary">× {item.quantity}</span>
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    Rs {(item.price * item.quantity).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border mt-4 pt-4 flex justify-between items-center">
              <span className="font-bold text-text-primary">Total paid</span>
              <span className="font-bold text-lg text-text-primary">Rs {order.total.toLocaleString()}</span>
            </div>
            <p className="text-xs text-text-secondary mt-4">
              Shipping to: {order.address}
            </p>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={downloadInvoice} variant="outline" size="lg">
              Download Invoice
            </Button>
            <Button onClick={printReceipt} variant="outline" size="lg">
              Print Receipt
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <Link href={`/user/orders/${order.id}`}>
              <Button className="w-full" size="lg">
                Track Order
              </Button>
            </Link>
            <Link href="/products">
              <Button className="w-full" size="lg" variant="ghost">
                Continue Shopping
              </Button>
            </Link>
          </div>

          <style jsx global>{`
            @keyframes pop {
              0% { transform: scale(0.5); opacity: 0; }
              70% { transform: scale(1.08); }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
