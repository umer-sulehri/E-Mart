'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Star, MessageSquare, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const filterTabs = ['All', '5-star', '4-star', '3-star', '2-star', '1-star'];

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
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(ITEMS_PER_PAGE));

      const res = await fetch(`/api/v1/seller/reviews?${params}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
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
  }, [page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filtered = reviews.filter((r) => {
    if (activeFilter === 'All') return true;
    const star = parseInt(activeFilter.charAt(0));
    return r.rating === star;
  });

  const averageRating = totalItems > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / Math.min(reviews.length, totalItems)
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }));

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
                  {totalItems > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}
                </p>
                <div className="mt-2 flex items-center justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn('h-5 w-5', star <= Math.round(averageRating) ? 'fill-warning text-warning' : 'text-muted-300')}
                    />
                  ))}
                </div>
                <p className="mt-1 text-sm text-muted-500">{totalItems} reviews</p>
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
          : filtered.map((review: any) => (
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
                            className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <div className="mt-2 flex gap-2">
                            <Button size="sm" onClick={() => handleReply(review.id)} disabled={submittingReply}>
                              <Send className="h-3.5 w-3.5" />
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

                  {!review.seller_reply && replyingTo !== review.id && (
                    <button
                      onClick={() => setReplyingTo(review.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-muted-200 px-3 py-1.5 text-xs font-medium text-muted-600 transition-colors hover:bg-muted-50"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Reply
                    </button>
                  )}
                </div>
              </div>
            ))}

        {!loading && filtered.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <Star className="mx-auto mb-3 h-10 w-10 text-muted-300" />
            <p className="text-sm text-muted-500">No reviews found for this filter</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-muted-200 p-2 text-muted-600 transition-colors hover:bg-muted-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = page <= 3 ? i + 1 : page + i - 2;
            if (p < 1 || p > totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                  p === page ? 'bg-primary text-white' : 'text-muted-600 hover:bg-muted-50'
                )}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-muted-200 p-2 text-muted-600 transition-colors hover:bg-muted-50 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
