import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface StockStatusIndicatorProps {
  stock: number;
  showQuantity?: boolean;
  className?: string;
}

export default function StockStatusIndicator({
  stock,
  showQuantity = false,
  className,
}: StockStatusIndicatorProps) {
  if (stock <= 0) {
    return (
      <Badge variant="danger" size="sm" className={cn(className)}>
        Out of Stock
      </Badge>
    );
  }

  if (stock <= 5) {
    return (
      <Badge variant="warning" size="sm" className={cn(className)}>
        Low Stock{showQuantity ? ` (${stock} left)` : ''}
      </Badge>
    );
  }

  return (
    <Badge variant="success" size="sm" className={cn(className)}>
      In Stock{showQuantity ? ` (${stock})` : ''}
    </Badge>
  );
}
