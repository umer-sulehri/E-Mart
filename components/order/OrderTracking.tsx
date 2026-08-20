import { Order } from '@/lib/types';
import { OrderStatusTimeline } from '@/components/order/OrderStatus';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface OrderTrackingProps {
  order: Order;
}

export function OrderTracking({ order }: OrderTrackingProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Order {order.orderNumber}</h2>
            <p className="text-sm text-text-secondary">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <OrderStatusTimeline currentStatus={order.status} />
      </Card>

      {order.estimatedDelivery && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-lg">📦</span>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Estimated Delivery</p>
              <p className="text-base font-semibold text-text-primary">
                {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="text-base font-semibold text-text-primary mb-3">Order Details</h3>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-text-secondary">{item.productName} x{item.quantity}</span>
              <span className="text-text-primary font-medium">PKR {(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="font-semibold text-text-primary">Total</span>
            <span className="font-bold text-primary-dark">PKR {order.total.toLocaleString()}</span>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-base font-semibold text-text-primary mb-2">Delivery Address</h3>
        <p className="text-sm text-text-secondary">{order.address}</p>
      </Card>
    </div>
  );
}
