'use client';

import Link from 'next/link';
import {
  BadgeCheck,
  Calendar,
  Clock,
  MessageSquareQuote,
  Pencil,
  Star,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn, formatPrice } from '@/lib/utils';
import { statusVariant, statusLabels, ratingLabels, type MyReviewData } from './types';

interface ReviewCardProps {
  review: MyReviewData;
  onEdit: (review: MyReviewData) => void;
  onDelete: (review: MyReviewData) => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const product = review.products;

  return (
    <div className="rounded-xl border border-muted-200 bg-white p-5">
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-muted-200 bg-muted-50">
          <ImageWithFallback
            src={Array.isArray(product?.images) && product!.images.length > 0
              ? product!.images[0]
              : '/images/placeholder.webp'}
            alt={product?.name ?? 'Product'}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {product?.slug ? (
              <Link
                href={`/products/${encodeURIComponent(product.slug)}`}
                className="max-w-full truncate font-semibold text-secondary-800 transition-colors hover:text-primary"
              >
                {product?.name ?? 'Product'}
              </Link>
            ) : (
              <span className="truncate font-semibold text-secondary-800">
                {product?.name ?? 'Product'}
              </span>
            )}
            <Badge variant={statusVariant[review.status]}>
              {statusLabels[review.status]}
            </Badge>
            {review.is_verified_purchase && (
              <Badge variant="success" className="gap-1">
                <BadgeCheck className="h-3 w-3" /> Verified Purchase
              </Badge>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-500">
            <span className="inline-flex items-center gap-1.5">
              <Star
                className={cn(
                  'h-4 w-4 fill-warning text-warning'
                )}
              />
              <span className="font-medium text-secondary-700">{review.rating}.0</span>
              <span className="text-muted-400">({ratingLabels[review.rating]})</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(review.created_at)}
            </span>
            {review.updated_at && review.updated_at !== review.created_at && (
              <span className="inline-flex items-center gap-1 text-muted-400">
                <Clock className="h-3.5 w-3.5" />
                edited {formatDate(review.updated_at)}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" />
              {review.helpful_count ?? 0} helpful
            </span>
            {product?.price != null && (
              <span className="ml-auto font-medium text-secondary-700">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </div>

      {review.title && (
        <h4 className="mt-4 text-sm font-semibold text-secondary-800">{review.title}</h4>
      )}
      {review.comment && (
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-600">
          {review.comment}
        </p>
      )}

      {review.seller_reply && (
        <div className="mt-4 rounded-lg bg-muted-50 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-secondary-700">
            <MessageSquareQuote className="h-3.5 w-3.5" />
            Seller reply
          </p>
          <p className="mt-1 text-sm text-muted-600">{review.seller_reply}</p>
        </div>
      )}

      {review.status === 'rejected' && (
        <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-600">
          This review was not approved and can no longer be edited. You can delete it
          and write a new one.
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2 border-t border-muted-100 pt-4">
        <Button
          variant="outline"
          size="sm"
          disabled={review.status === 'rejected'}
          onClick={() => onEdit(review)}
          aria-label={`Edit review for ${product?.name ?? 'product'}`}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          variant="warning"
          size="sm"
          onClick={() => onDelete(review)}
          aria-label={`Delete review for ${product?.name ?? 'product'}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}