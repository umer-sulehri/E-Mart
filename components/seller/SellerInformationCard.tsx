import Link from 'next/link';
import { Star, MapPin, Clock, ExternalLink } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface SellerInfo {
  id: string;
  name: string;
  slug?: string;
  rating: number;
  totalSales: number;
  joinedDate: string;
  location?: string;
  isVerified?: boolean;
}

interface SellerInformationCardProps {
  seller: SellerInfo;
  className?: string;
}

export default function SellerInformationCard({
  seller,
  className,
}: SellerInformationCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-muted-100 bg-white p-5 shadow-sm',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base font-bold text-secondary-800">
              {seller.name}
            </h3>
            {seller.isVerified && (
              <Badge variant="success" size="sm">
                Verified
              </Badge>
            )}
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs text-muted-500">
            <span className="flex items-center gap-1">
              <Star size={12} className="fill-warning text-warning" />
              {seller.rating.toFixed(1)} rating
            </span>
            <span>{seller.totalSales.toLocaleString()} sales</span>
          </div>

          <div className="mt-2 flex flex-col gap-1 text-xs text-muted-500">
            {seller.location && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {seller.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Member since {seller.joinedDate}
            </span>
          </div>
        </div>
      </div>

      {seller.slug && (
        <Link
          href={`/sellers/${seller.slug}`}
          className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-muted-200 py-2 text-sm font-medium text-secondary-700 transition-colors hover:border-primary hover:text-primary"
        >
          Visit Store
          <ExternalLink size={12} />
        </Link>
      )}
    </div>
  );
}
