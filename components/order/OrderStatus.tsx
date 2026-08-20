import { OrderStatus as OrderStatusType } from '@/lib/types';
import { ClockIcon, CheckCircleIcon, CogIcon, TruckIcon, PackageIcon } from '@/components/icons';

interface OrderStatusProps {
  currentStatus: OrderStatusType;
}

const steps: { status: OrderStatusType; label: string; icon: React.ReactNode }[] = [
  { status: 'pending', label: 'Pending', icon: <ClockIcon className="w-5 h-5" /> },
  { status: 'confirmed', label: 'Confirmed', icon: <CheckCircleIcon className="w-5 h-5" /> },
  { status: 'processing', label: 'Processing', icon: <CogIcon className="w-5 h-5" /> },
  { status: 'shipped', label: 'Shipped', icon: <TruckIcon className="w-5 h-5" /> },
  { status: 'delivered', label: 'Delivered', icon: <PackageIcon className="w-5 h-5" /> },
];

const statusOrder: OrderStatusType[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export function OrderStatusTimeline({ currentStatus }: OrderStatusProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const isCancelled = currentStatus === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 p-4 bg-error/10 rounded-[12px]">
        <span className="text-error font-semibold">Order has been cancelled</span>
      </div>
    );
  }

  return (
    <div className="flex items-center w-full" role="list" aria-label="Order status timeline">
      {steps.map((step, index) => {
        const stepIndex = statusOrder.indexOf(step.status);
        const isCompleted = stepIndex <= currentIndex;
        const isCurrent = step.status === currentStatus;

        return (
          <div key={step.status} className="flex items-center flex-1 last:flex-initial" role="listitem">
            <div className="flex flex-col items-center gap-2 min-w-[60px]">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isCompleted
                    ? 'bg-primary text-text-inverse'
                    : 'bg-surface text-text-secondary border border-border'
                } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {step.icon}
              </div>
              <span className={`text-xs font-medium text-center ${isCompleted ? 'text-primary-dark' : 'text-text-secondary'}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-1 rounded-full ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
