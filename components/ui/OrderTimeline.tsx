import { Check, Clock, Package, Truck, MapPin, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineStep {
  status: string;
  label: string;
  date?: string;
  description?: string;
}

interface OrderTimelineProps {
  steps: TimelineStep[];
  currentStatus: string;
  className?: string;
}

const STATUS_ORDER = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
];

const STATUS_ICONS: Record<string, typeof Check> = {
  pending: Clock,
  confirmed: Check,
  processing: Package,
  shipped: Truck,
  out_for_delivery: MapPin,
  delivered: PartyPopper,
};

export default function OrderTimeline({
  steps,
  currentStatus,
  className,
}: OrderTimelineProps) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className={cn('relative', className)}>
      {steps.map((step, index) => {
        const stepIdx = STATUS_ORDER.indexOf(step.status);
        const isCompleted = stepIdx <= currentIdx;
        const isCurrent = step.status === currentStatus;
        const Icon = STATUS_ICONS[step.status] || Check;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.status} className="relative flex gap-4">
            {/* Vertical line */}
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[15px] top-[32px] h-[calc(100%-16px)] w-0.5',
                  isCompleted ? 'bg-primary' : 'bg-muted-200'
                )}
              />
            )}

            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                isCurrent && 'bg-primary text-white ring-4 ring-primary/20',
                isCompleted && !isCurrent && 'bg-primary text-white',
                !isCompleted && 'bg-muted-100 text-muted-400'
              )}
            >
              <Icon size={16} />
            </div>

            {/* Content */}
            <div className={cn('pb-8', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-semibold',
                  isCompleted ? 'text-secondary-800' : 'text-muted-400'
                )}
              >
                {step.label}
              </p>
              {step.date && (
                <p className="mt-0.5 text-xs text-muted-500">{step.date}</p>
              )}
              {step.description && (
                <p className="mt-1 text-xs text-muted-500">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
