import { Order } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-text-primary">{order.orderNumber}</h3>
          <p className="text-sm text-text-secondary">
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {order.items.slice(0, 4).map((item) => (
          <div key={item.id} className="relative w-14 h-14 flex-shrink-0 rounded-[10px] overflow-hidden bg-bg border border-border">
            <Image
              src={item.productImage}
              alt={item.productName}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
        ))}
        {order.items.length > 4 && (
          <span className="text-sm text-text-secondary px-2">+{order.items.length - 4} more</span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-lg font-bold text-primary-dark">PKR {order.total.toLocaleString()}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Track</Button>
          {order.status === 'pending' && (
            <Button variant="ghost" size="sm" className="text-error hover:text-error">
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
