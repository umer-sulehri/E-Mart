import { OrderStatus } from '@/lib/types';
import { CheckCircleIcon, ClockIcon, CogIcon, TruckIcon, XCircleIcon, PackageIcon } from '@/components/icons';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<OrderStatus, { label: string; labelUrdu: string; bgClass: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending', labelUrdu: 'زیر التوا', bgClass: 'bg-warning/20 text-warning',
    icon: <ClockIcon className="w-4 h-4" />,
  },
  confirmed: {
    label: 'Confirmed', labelUrdu: 'تصدیق شدہ', bgClass: 'bg-primary/20 text-primary-dark',
    icon: <CheckCircleIcon className="w-4 h-4" />,
  },
  processing: {
    label: 'Processing', labelUrdu: 'عمل میں', bgClass: 'bg-accent/20 text-accent',
    icon: <CogIcon className="w-4 h-4" />,
  },
  shipped: {
    label: 'Shipped', labelUrdu: 'بھیج دیا گیا', bgClass: 'bg-primary/20 text-primary-dark',
    icon: <TruckIcon className="w-4 h-4" />,
  },
  delivered: {
    label: 'Delivered', labelUrdu: 'پہنچا دیا گیا', bgClass: 'bg-success/20 text-success',
    icon: <PackageIcon className="w-4 h-4" />,
  },
  cancelled: {
    label: 'Cancelled', labelUrdu: 'منسوخ', bgClass: 'bg-error/20 text-error',
    icon: <XCircleIcon className="w-4 h-4" />,
  },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${config.bgClass} ${className}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
