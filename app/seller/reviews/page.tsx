'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Star, MessageSquare, Send, CheckCircle2, Ban, Trash2, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { PAGE_SIZE as ITEMS_PER_PAGE } from '@/lib/pagination';
import { usePageParam } from '@/hooks/usePageParam';
import { cn } from '@/lib/utils';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import type { ReviewRow } from '@/types/supabase';

const filterTabs = ['All', '5-star', '4-star', '3-star', '2-star', '1-star'];

/**
 * Rating summary over every review the seller has, returned by the endpoint.
 * It is computed server-side because the rows in `reviews` are only the current
 * page, so deriving an average or a star distribution from them would describe
 * 10 reviews rather than the seller's whole history.
 */
interface RatingStats {
  averageRating: number;
  distribution: Record<string, number>;
  totalRated: number;
}

const EMPTY_STATS: RatingStats = {
  averageRating: 0,
  distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
  totalRated: 0,
};

/** `'5-star'` -> `5`; `'All'` -> `null` (no server-side rating filter). */
function parseStarTab(tab: string): number | null {
  if (tab === 'All') return null;
  const star = Number(tab.charAt(0));
  return Number.isInteger(star) && star >= 1 && star <= 5 ? star : null;
}

function StatusBadge({ status }: { status: ReviewRow['status'] }) {
  const map: Record<
    ReviewRow['status'],
    { variant: 'warning' | 'success' | 'danger'; label: string }
  > = {
    pending: { variant: 'warning', label: 'Pending' },
    approved: { variant: 'success', label: 'Approved' },
    flagged: { variant: 'danger', label: 'Flagged' },
    rejected: { variant: 'danger', label: 'Rejected' },
  };
  const m = map[status] || map.pending;
  return (
    <Badge variant={m.variant} size="sm">
      {m.label}
    </Badge>
  );
}

function SkeletonReview() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 animate-pulse rounded-full bg-muted-200" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-40 animate-pulse rounded bg-muted-200" />
          <div className="h-3 w-32 animate-pulse rounded bg-muted-200" />
          <div className="h-3 w-full animate-pulse rounded bg-muted-200" />
        </div>
      </div>
    </div>
  );
}

export default function SellerReviewsPage() {
  return (
    <Suspense>
      <SellerReviewsContent />
    </Suspense>
  );
}

function SellerReviewsContent() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [stats, setStats] = useState<RatingStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReviewRow | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const { page, setPage } = usePageParam({ resetOn: [activeFilter] });

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(ITEMS_PER_PAGE));
      // The star tab is applied by the endpoint, so each tab spans the seller's
      // whole history instead of just the rows that happen to be on this page.
      const star = parseStarTab(activeFilter);
      if (star !== null) params.set('rating', String(star));

      const res = await fetch(`/api/v1/seller/reviews?${params}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
        setStats(data.stats || EMPTY_STATS);
        setTotalPages(data.meta?.totalPages || 1);
        setTotalItems(data.meta?.totalItems || 0);
      } else {
        toast.error(data.error || 'Failed to load reviews');
      }
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const averageRating = stats.averageRating;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = stats.distribution[String(star)] ?? 0;
    return {
      star,
      count,
      percentage: stats.totalRated > 0 ? (count / stats.totalRated) * 100 : 0,
    };
  });

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/v1/seller/reviews/${reviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Reply sent');
        setReplyingTo(null);
        setReplyText('');
        fetchReviews();
      } else {
        toast.error(data.error || 'Failed to send reply');
      }
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleModerate = async (
    reviewId: string,
    action: 'approve' | 'reject' | 'delete'
  ) => {
    setActing(reviewId);
    try {
      if (action === 'delete') {
        const res = await fetch(`/api/v1/seller/reviews/${reviewId}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (data.success) toast.success('Review deleted');
        else toast.error(data.error || 'Failed to delete review');
      } else {
        const status = action === 'approve' ? 'approved' : 'rejected';
        const res = await fetch(`/api/v1/seller/reviews/${reviewId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (data.success)
          toast.success(action === 'approve' ? 'Review approved' : 'Review rejected');
        else toast.error(data.error || 'Update failed');
      }
      fetchReviews();
    } catch {
      toast.error('Action failed');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary-800">Reviews</h2>
        <p className="text-sm text-muted-500">Manage customer reviews and respond to feedback</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex items-center gap-8 rounded-xl bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex w-full items-center justify-center py-8">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted-200" />
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-5xl font-bold text-secondary-800">
                  {loading && stats.totalRated === 0 ? '—' : averageRating.toFixed(1)}
                </p>
                <div className="mt-2 flex items-center justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn('h-5 w-5', star <= Math.round(averageRating) ? 'fill-warning text-warning' : 'text-muted-300')}
                    />
                  ))}
                </div>
                <p className="mt-1 text-sm text-muted-500">{stats.totalRated} reviews</p>
              </div>
              <div className="flex-1 space-y-2">
                {ratingDistribution.map((dist) => (
                  <div key={dist.star} className="flex items-center gap-3">
                    <span className="w-12 text-sm text-muted-600">{dist.star} star</span>
                    <div className="flex-1 overflow-hidden rounded-full bg-muted-100">
                      <div className="h-2.5 rounded-full bg-warning" style={{ width: `${dist.percentage}%` }} />
                    </div>
                    <span className="w-8 text-right text-sm text-muted-600">{dist.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  activeFilter === tab
                    ? 'bg-primary text-white'
                    : 'bg-muted-100 text-muted-600 hover:bg-muted-200'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonReview key={i} />)
          : reviews.map((review: ReviewRow) => (
              <div key={review.id} className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                      {review.profiles?.first_name?.charAt(0) ?? '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-secondary-800">
                          {review.profiles?.first_name} {review.profiles?.last_name}
                        </p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn('h-3.5 w-3.5', star <= review.rating ? 'fill-warning text-warning' : 'text-muted-300')}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-500">{formatDate(review.created_at)}</span>
                        <StatusBadge status={review.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-primary">{review.products?.name ?? ''}</p>
                      <p className="mt-2 text-sm text-muted-700">{review.comment}</p>

                      {review.seller_reply && (
                        <div className="mt-3 rounded-lg bg-muted-50 p-3">
                          <p className="text-xs font-semibold text-secondary-800">Your Reply</p>
                          <p className="mt-1 text-sm text-muted-600">{review.seller_reply}</p>
                        </div>
                      )}

                      {replyingTo === review.id && !review.seller_reply && (
                        <div className="mt-3">
                          <textarea
                            rows={2}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your reply..."
                            className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-base sm:text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <div className="mt-2 flex gap-2">
                            <Button size="sm" onClick={() => handleReply(review.id)} disabled={submittingReply}>
                              <Send className="size-3.5" />
                              {submittingReply ? 'Sending...' : 'Send Reply'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyText(''); }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {!review.seller_reply && replyingTo !== review.id && (
                      <button
                        onClick={() => setReplyingTo(review.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-muted-200 px-3 py-1.5 text-xs font-medium text-muted-600 transition-colors hover:bg-muted-50"
                      >
                        <MessageSquare className="size-3.5" />
                        Reply
                      </button>
                    )}
                    <div className="flex items-center gap-1">
                      {review.status !== 'approved' && (
                        <button
                          onClick={() => handleModerate(review.id, 'approve')}
                          disabled={acting === review.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-success-200 px-2.5 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success-50 disabled:opacity-50"
                        >
                          <CheckCircle2 className="size-3.5" />
                          Approve
                        </button>
                      )}
                      {review.status !== 'rejected' && (
                        <button
                          onClick={() => handleModerate(review.id, 'reject')}
                          disabled={acting === review.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-muted-200 px-2.5 py-1.5 text-xs font-medium text-secondary-700 transition-colors hover:bg-muted-50 disabled:opacity-50"
                        >
                          <Ban className="size-3.5" />
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(review)}
                        disabled={acting === review.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-danger-200 px-2.5 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-50 disabled:opacity-50"
                      >
                        {acting === review.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

        {!loading && reviews.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <Star className="mx-auto mb-3 size-10 text-muted-300" />
            <p className="text-sm text-muted-500">
              {activeFilter === 'All'
                ? 'No reviews yet'
                : `No ${activeFilter} reviews found`}
            </p>
          </div>
        )}
      </div>

      <Pagination
        variant="numbered"
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel={activeFilter === 'All' ? 'reviews' : activeFilter}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            handleModerate(deleteTarget.id, 'delete').finally(() => setDeleteTarget(null));
          } else {
            setDeleteTarget(null);
          }
        }}
        title="Delete review?"
        message={
          deleteTarget
            ? `This will permanently remove this review. This action cannot be undone.`
            : ''
        }
        variant="danger"
        confirmLabel="Delete review"
        loading={deleteTarget !== null && acting === deleteTarget.id}
      />
    </div>
  );
}
