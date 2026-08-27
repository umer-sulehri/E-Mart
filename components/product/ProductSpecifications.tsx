import { cn } from '@/lib/utils';

export interface Specification {
  key: string;
  value: string;
}

interface ProductSpecificationsProps {
  specifications: Specification[];
  className?: string;
}

export default function ProductSpecifications({
  specifications,
  className,
}: ProductSpecificationsProps) {
  if (!specifications || specifications.length === 0) {
    return (
      <div className={cn('py-8 text-center text-sm text-muted-500', className)}>
        No specifications available for this product.
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-2xl', className)}>
      <table className="w-full text-sm">
        <tbody>
          {specifications.map((spec, index) => (
            <tr
              key={spec.key}
              className={cn(
                index % 2 === 0 ? 'bg-muted-50' : 'bg-white'
              )}
            >
              <td className="px-5 py-3 font-medium text-secondary-800">
                {spec.key}
              </td>
              <td className="px-5 py-3 text-muted-600">{spec.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
