'use client';

import * as React from 'react';
import Image from 'next/image';
import { ThumbsUp, ChevronDown, PenLine, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { PAGE_SIZE } from '@/lib/pagination';
import { usePageParam } from '@/hooks/usePageParam';
import { formatDate, cn } from '@/lib/utils';
import { tryParseJson } from '@/lib/api';

export interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  helpfulCount: number;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';

export interface ReviewListProps {
  productSlug?: string;
  onWriteReview?: () => void;
  onReviewCountChange?: (count: number) => void;
  refreshSignal?: number;
  className?: string;
}

function ReviewSkeleton() {
  return (
    <div className="rounded-xl border border-muted-100 bg-white p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-28 bg-muted-200 rounded animate-pulse" />
            <div className="h-3 w-20 bg-muted-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="h-4 w-4 bg-muted-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
      <div className="h-4 w-48 bg-muted-200 rounded animate-pulse" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-muted-100 rounded animate-pulse" />
        <div className="h-3 w-3/4 bg-muted-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

const ReviewList = React.forwardRef<HTMLDivElement, ReviewListProps>(
  (props, ref) => (
    // The page number lives in the URL, which means this component reads
    // `useSearchParams`. That opts the product route out of static rendering,
    // so the boundary has to sit here rather than at the page level - and the
    // `ref` has to be forwarded into the inner component for `ProductTabs` to
    // keep scrolling to the reviews tab.
    <React.Suspense fallback={<div ref={ref} className={cn('space-y-6', props.className)} />}>
      <ReviewListContent {...props} containerRef={ref} />
    </React.Suspense>
  )
);

interface ReviewListContentProps extends ReviewListProps {
  containerRef: React.Ref<HTMLDivElement>;
}

function ReviewListContent({
  productSlug,
  onWriteReview,
  onReviewCountChange,
  refreshSignal,
  className,
  containerRef,
}: ReviewListContentProps) {
    const [sortBy, setSortBy] = React.useState<SortOption>('newest');
    const [showSortDropdown, setShowSortDropdown] = React.useState(false);
    const [helpfulClicked, setHelpfulClicked] = React.useState<Set<string>>(new Set());
    const [reviews, setReviews] = React.useState<Review[]>([]);
    const [totalReviews, setTotalReviews] = React.useState(0);
    const [totalPages, setTotalPages] = React.useState(1);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // `page` in the URL rather than `useState`. Local state lost the reader's
    // place on refresh, on back/forward, and on a shared link, and the reviews
    // list is the one place on the product page where that is most noticeable.
    // `resetOn` makes a sort change drop a stale page automatically.
    const { page, setPage } = usePageParam({ resetOn: [sortBy, productSlug] });

    const fetchReviews = React.useCallback(async () => {
      if (!productSlug) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Sort and page both go to the server. Sorting the rows that came back
        // would rank only the reviews that happen to be on the current page, and
        // a fixed `page=1&limit=20` left every later review unreachable.
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          sort: sortBy,
        });
        const res = await fetch(
          `/api/v1/products/${encodeURIComponent(productSlug)}/reviews?${params.toString()}`,
          { cache: 'no-store' }
        );

        const json = await tryParseJson<{
          success: boolean;
          error?: string;
          data?: {
            reviews?: {
              id: string;
              rating: number;
              title?: string | null;
              comment?: string | null;
              helpful_count?: number;
              is_verified_purchase?: boolean;
              created_at?: string;
              profiles?: {
                first_name?: string | null;
                last_name?: string | null;
                profile_image_url?: string | null;
              } | null;
            }[];
          };
          meta?: { totalItems?: number; totalPages?: number };
        }>(res);

        if (!res.ok || !json?.success || !json.data) {
          throw new Error(
            json?.error ||
              (res.ok
                ? 'Received an invalid response from the server. Please try again.'
                : `Failed to load reviews (HTTP ${res.status}). Please try again.`)
          );
        }

        const fetched: Review[] = (json.data.reviews || []).map((r) => ({
          id: r.id,
          userName:
            r.profiles
              ? `${r.profiles.first_name || ''} ${r.profiles.last_name || ''}`.trim() || 'Anonymous'
              : 'Anonymous',
          userAvatar: r.profiles?.profile_image_url ?? undefined,
          rating: r.rating,
          title: r.title ?? undefined,
          comment: r.comment ?? '',
          helpfulCount: r.helpful_count || 0,
          isVerifiedPurchase: r.is_verified_purchase || false,
          createdAt: r.created_at ?? '',
        }));

        // The order comes from the server (see the `sort=helpful` branch), so
        // the rows are rendered as received rather than re-ranked locally.
        setReviews(fetched);
        setTotalPages(json.meta?.totalPages || 1);
        setTotalReviews(json.meta?.totalItems || fetched.length);
        onReviewCountChange?.(json.meta?.totalItems || fetched.length);

        // A review can be deleted or moderated away, which can leave `?page=`
        // pointing past the end.
        const pages = json.meta?.totalPages || 1;
        if (page > pages) {
          setPage(pages);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }, [productSlug, sortBy, page, onReviewCountChange, setPage]);

    React.useEffect(() => {
      fetchReviews();
    }, [fetchReviews]);

    // `usePageParam`'s `resetOn` rewrites the URL back to page 1 when the sort
    // changes, so there is no manual reset here.
    const selectSort = (option: SortOption) => {
      setShowSortDropdown(false);
      setSortBy(option);
    };

    // Re-fetch when a sibling notifies us that a review was just submitted.
    React.useEffect(() => {
      if (refreshSignal && refreshSignal > 0) {
        fetchReviews();
      }
    }, [refreshSignal, fetchReviews]);

    const handleHelpful = async (reviewId: string) => {
      const isCurrentlyHelpful = helpfulClicked.has(reviewId);
      const next = new Set(helpfulClicked);
      if (isCurrentlyHelpful) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      setHelpfulClicked(next);

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, helpfulCount: r.helpfulCount + (isCurrentlyHelpful ? -1 : 1) }
            : r
        )
      );

      try {
        const res = await fetch(`/api/v1/reviews/${reviewId}/helpful`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const json = await tryParseJson<{ success: boolean; error?: string }>(res);
        if (!json?.success) {
          toast.error(json?.error || 'Failed to update');
        }
      } catch {
        toast.error('Failed to update');
      }
    };

    const handleReport = async (reviewId: string) => {
      try {
        const res = await fetch(`/api/v1/reviews/${reviewId}/report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Inappropriate content' }),
        });
        const json = await tryParseJson<{ success: boolean; error?: string }>(res);
        if (json?.success) {
          toast.success('Review reported. Thank you!');
        } else {
          toast.error(json?.error || 'Failed to report');
        }
      } catch {
        toast.error('Failed to report review');
      }
    };

    const sortLabel = (s: SortOption) => {
      switch (s) {
        case 'newest': return 'Most Recent';
        case 'oldest': return 'Oldest First';
        case 'highest': return 'Highest Rated';
        case 'lowest': return 'Lowest Rated';
        case 'helpful': return 'Most Helpful';
      }
    };

    return (
      <div ref={containerRef} className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-heading text-lg font-bold text-secondary-800">
            Customer Reviews ({loading ? '...' : totalReviews})
          </h3>
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-700 transition-colors hover:border-muted-300"
              >
                {sortLabel(sortBy)}
                <ChevronDown size={14} />
              </button>
              {showSortDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortDropdown(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-muted-200 bg-white shadow-lg">
                    {(['newest', 'oldest', 'highest', 'lowest', 'helpful'] as SortOption[]).map(
                      (option) => (
                        <button
                          key={option}
                          onClick={() => selectSort(option)}
                          className={cn(
                            'flex w-full items-center px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted-50',
                            sortBy === option && 'font-medium text-primary'
                          )}
                        >
                          {sortLabel(option)}
                        </button>
                      )
                    )}
                  </div>
                </>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={onWriteReview}>
              <PenLine size={14} />
              Write a Review
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <ReviewSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-6 text-center">
            <p className="text-sm text-danger">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchReviews}>
              Try Again
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && reviews.length === 0 && (
          <div className="rounded-xl border border-muted-100 bg-white p-10 text-center">
            <p className="text-sm text-muted-500">No reviews yet. Be the first to review!</p>
          </div>
        )}

        {/* Reviews */}
        {!loading && !error && reviews.length > 0 && (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-muted-100 bg-white p-5"
              >
                {/* User Info */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted-200">
                      {review.userAvatar ? (
                        <Image
                          src={review.userAvatar}
                          alt={review.userName}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-600">
                          {review.userName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-secondary-800">
                          {review.userName}
                        </span>
                        {review.isVerifiedPurchase && (
                          <span className="rounded-full bg-success-100 px-2 py-0.5 text-[10px] font-medium text-success-700">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>

                {/* Review Content */}
                {review.title && (
                  <h4 className="mb-1 text-sm font-bold text-secondary-800">
                    {review.title}
                  </h4>
                )}
                <p className="text-sm leading-relaxed text-muted-700">
                  {review.comment}
                </p>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => handleHelpful(review.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                      helpfulClicked.has(review.id)
                        ? 'bg-primary-100 text-primary'
                        : 'bg-muted-50 text-muted-600 hover:bg-muted-100'
                    )}
                  >
                    <ThumbsUp size={12} />
                    Helpful ({review.helpfulCount})
                  </button>
                  <button
                    onClick={() => handleReport(review.id)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-400 transition-colors hover:bg-danger-50 hover:text-danger"
                  >
                    <Flag size={12} />
                    Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <Pagination
            className="pt-2"
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalReviews}
            itemsPerPage={PAGE_SIZE}
            itemLabel="reviews"
            // `usePageParam` navigates without scrolling, so the reader is not
            // yanked back to the top of a long product page on every page
            // change - they stay on the reviews section they just clicked from.
            scrollToTop={false}
          />
        )}
      </div>
    );
}

ReviewList.displayName = 'ReviewList';

export default ReviewList;
