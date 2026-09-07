'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Package, Star, Loader2 } from 'lucide-react';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ReviewableItem {
  orderItemId: string;
  productId: string | null;
  slug: string | null;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  sellerName: string | null;
}

interface OrderPayload {
  id: string;
  orderNumber?: string;
  status: string;
  createdAt?: string;
  subtotal?: number;
  shippingCost?: number;
  tax?: number;
  discount?: number;
  total?: number;
  order_items?: Array<Record<string, unknown>>;
}

const ratingLabels: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export default function WriteReviewPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const router = useRouter();

  const [order, setOrder] = useState<OrderPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const [ratingByItem, setRatingByItem] = useState<Record<string, number>>({});
  const [titleByItem, setTitleByItem] = useState<Record<string, string>>({});
  const [commentByItem, setCommentByItem] = useState<Record<string, string>>({});
  const [errorsByItem, setErrorsByItem] = useState<Record<string, Record<string, string>>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [hoveredRating, setHoveredRating] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/orders/${orderId}`);
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const json = await res.json();
        if (!cancelled && json.success) {
          setOrder(json.data as OrderPayload);
        } else if (!cancelled) {
          toast.error(json.error || 'Order not found');
        }
      } catch {
        if (!cancelled) toast.error('Failed to load order details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOrder();
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  const items = useMemo<ReviewableItem[]>(() => {
    if (!order?.order_items) return [];
    return order.order_items.map((item) => {
      const raw = item as Record<string, unknown>;
      const products = (raw.products ?? raw.product) as
        | Record<string, unknown>
        | undefined;
      const vendors = (raw.vendors ?? raw.vendor) as
        | Record<string, unknown>
        | undefined;
      const images = Array.isArray(products?.images) ? (products.images as string[]) : [];
      return {
        orderItemId: String(raw.id ?? ''),
        productId: (raw.product_id as string) ?? null,
        slug: (products?.slug as string) ?? null,
        name: (raw.product_name as string) || (products?.name as string) || 'Product',
        image: (raw.product_image as string) || images[0] || '/images/placeholder.webp',
        quantity: Number(raw.quantity ?? 1),
        unitPrice: Number(raw.price ?? raw.total ?? 0),
        sellerName: (vendors?.name as string) ?? null,
      };
    });
  }, [order]);

  const validateItem = (id: string) => {
    const newErrors: Record<string, string> = {};
    if (!ratingByItem[id]) newErrors.rating = 'Please select a rating';
    if ((titleByItem[id] ?? '').trim().length < 3)
      newErrors.title = 'Title must be at least 3 characters';
    if ((commentByItem[id] ?? '').trim().length < 10)
      newErrors.comment = 'Comment must be at least 10 characters';
    setErrorsByItem((prev) => ({ ...prev, [id]: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (item: ReviewableItem) => {
    if (reviewed[item.orderItemId] || submitting === item.orderItemId) return;
    if (!validateItem(item.orderItemId)) {
      toast.error('Please complete the required fields');
      return;
    }
    if (!item.slug) {
      toast.error('Unable to review this product');
      return;
    }

    setSubmitting(item.orderItemId);
    try {
      const res = await fetch(
        `/api/v1/products/${encodeURIComponent(item.slug)}/reviews`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating: ratingByItem[item.orderItemId],
            title: titleByItem[item.orderItemId].trim(),
            comment: commentByItem[item.orderItemId].trim(),
          }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || 'Failed to submit review');
        return;
      }
      toast.success(`Review submitted for ${item.name}!`);
      setReviewed((prev) => ({ ...prev, [item.orderItemId]: true }));
    } catch {
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" width={140} height={20} />
        <Skeleton variant="rectangle" height={120} className="w-full" />
        <Skeleton variant="rectangle" height={260} className="w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-600 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-muted-300" />
          <p className="mt-4 text-lg font-semibold text-secondary-800">Order not found</p>
          <Link href="/dashboard/orders">
            <Button variant="primary" className="mt-4">
              View All Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-600 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
        <Badge variant="primary" size="md">
          {order.orderNumber || order.id}
        </Badge>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-secondary-800">
          Write a Review
        </h1>
        <p className="mt-1 text-sm text-muted-500">
          Share your experience with each product from order{' '}
          <span className="font-medium text-secondary-700">
            {order.orderNumber || order.id}
          </span>
          . Your honest feedback helps other shoppers.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-muted-300" />
          <p className="mt-4 text-sm text-muted-500">No items found for this order.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => {
            const reviewedItem = reviewed[item.orderItemId];
            const area = errorsByItem[item.orderItemId] ?? {};
            const displayRating =
              hoveredRating[item.orderItemId] || ratingByItem[item.orderItemId] || 0;

            if (reviewedItem) {
              return (
                <div
                  key={item.orderItemId}
                  className="rounded-xl border border-success-200 bg-success-50 p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-muted-200 bg-white">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-secondary-800">{item.name}</p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-success">
                        <CheckCircle2 className="h-4 w-4" />
                        Review submitted
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.orderItemId} className="rounded-xl bg-white p-6 shadow-sm">
                {/* Product summary */}
                <div className="flex items-start gap-4 border-b border-muted-100 pb-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-muted-200 bg-muted-50">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-secondary-800">{item.name}</p>
                    {item.sellerName && (
                      <p className="mt-0.5 text-xs text-muted-500">
                        Sold by <span className="font-medium text-secondary-700">{item.sellerName}</span>
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-400">
                      Qty: {item.quantity} · {formatPrice(item.unitPrice)} each
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-secondary-800">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          setRatingByItem((prev) => ({ ...prev, [item.orderItemId]: star }));
                          setErrorsByItem((prev) => ({
                            ...prev,
                            [item.orderItemId]: { ...prev[item.orderItemId], rating: '' },
                          }));
                        }}
                        onMouseEnter={() =>
                          setHoveredRating((prev) => ({ ...prev, [item.orderItemId]: star }))
                        }
                        onMouseLeave={() =>
                          setHoveredRating((prev) => ({ ...prev, [item.orderItemId]: 0 }))
                        }
                        className="p-0.5 transition-transform hover:scale-110"
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          size={26}
                          className={cn(
                            'transition-colors',
                            star <= displayRating
                              ? 'fill-warning text-warning'
                              : 'fill-none text-muted-300'
                          )}
                        />
                      </button>
                    ))}
                    {displayRating > 0 && (
                      <span className="ml-2 text-sm text-muted-600">{ratingLabels[displayRating]}</span>
                    )}
                  </div>
                  {area.rating && <p className="mt-1.5 text-xs text-danger">{area.rating}</p>}
                </div>

                {/* Title */}
                <div className="mt-4">
                  <label
                    htmlFor={`review-title-${item.orderItemId}`}
                    className="mb-1.5 block text-sm font-medium text-secondary-800"
                  >
                    Review Title
                  </label>
                  <input
                    id={`review-title-${item.orderItemId}`}
                    type="text"
                    value={titleByItem[item.orderItemId] ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTitleByItem((prev) => ({ ...prev, [item.orderItemId]: value }));
                      if (value.trim().length >= 3) {
                        setErrorsByItem((prev) => ({
                          ...prev,
                          [item.orderItemId]: { ...prev[item.orderItemId], title: '' },
                        }));
                      }
                    }}
                    placeholder="Summarize your experience"
                    className={cn(
                      'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-secondary-800',
                      'placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                      area.title ? 'border-danger' : 'border-muted-200'
                    )}
                  />
                  {area.title && <p className="mt-1.5 text-xs text-danger">{area.title}</p>}
                </div>

                {/* Comment */}
                <div className="mt-4">
                  <label
                    htmlFor={`review-comment-${item.orderItemId}`}
                    className="mb-1.5 block text-sm font-medium text-secondary-800"
                  >
                    Your Review
                  </label>
                  <textarea
                    id={`review-comment-${item.orderItemId}`}
                    value={commentByItem[item.orderItemId] ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCommentByItem((prev) => ({ ...prev, [item.orderItemId]: value }));
                      if (value.trim().length >= 10) {
                        setErrorsByItem((prev) => ({
                          ...prev,
                          [item.orderItemId]: { ...prev[item.orderItemId], comment: '' },
                        }));
                      }
                    }}
                    placeholder="Tell others about your experience with this product..."
                    rows={4}
                    className={cn(
                      'w-full resize-none rounded-lg border bg-white px-3.5 py-2.5 text-sm text-secondary-800',
                      'placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                      area.comment ? 'border-danger' : 'border-muted-200'
                    )}
                  />
                  {area.comment && <p className="mt-1.5 text-xs text-danger">{area.comment}</p>}
                </div>

                <div className="mt-5 flex justify-end">
                  <Button
                    variant="primary"
                    loading={submitting === item.orderItemId}
                    disabled={submitting === item.orderItemId}
                    onClick={() => handleSubmit(item)}
                  >
                    {submitting === item.orderItemId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Star className="h-4 w-4 fill-current" />
                    )}
                    Submit Review
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && Object.keys(reviewed).length === items.length && (
        <div className="rounded-xl bg-success-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
          <p className="mt-3 font-semibold text-secondary-800">
            All reviews submitted. Thank you!
          </p>
          <Link href="/dashboard/orders">
            <Button variant="primary" className="mt-4">
              Back to Orders
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}