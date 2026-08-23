'use client';

import { useState } from 'react';
import { useSellerReviews, type ReviewWithProduct } from '@/hooks/useReviews';
import { useReplyToReview } from '@/hooks/useSeller';
import { useToast } from '@/components/ui/Toast';
import { StarIcon, SearchIcon, CheckCircleIcon, EditIcon } from '@/components/icons';

export default function SellerReviewsPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'rating'>('newest');
  const toast = useToast();
  const replyMutation = useReplyToReview();
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState('');

  const { data: reviewsData, isLoading } = useSellerReviews();
  const reviews = reviewsData ?? [];

  const openReply = (review: ReviewWithProduct) => {
    setReplyTarget(review.id);
    setReplyText(review.sellerReply ?? '');
    setReplyError('');
  };

  const submitReply = () => {
    if (!replyTarget) return;
    if (replyText.trim().length < 2) {
      setReplyError('Reply must be at least 2 characters.');
      return;
    }
    replyMutation.mutate(
      { id: replyTarget, reply: replyText.trim() },
      {
        onSuccess: () => {
          toast.showToast('Reply published.', 'success');
          setReplyTarget(null);
          setReplyText('');
        },
        onError: (err) => setReplyError(err instanceof Error ? err.message : 'Failed to save reply.'),
      }
    );
  };

  const filtered = reviews
    .filter((r) => !search || r.productName?.toLowerCase().includes(search.toLowerCase()) || r.userName?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'newest' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : b.rating - a.rating);

  const avgRating = reviews.length > 0 ? reviews.reduce((s: number, r: ReviewWithProduct) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-[16px] p-6" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 10px 25px rgba(122,155,118,0.3)' }}>
        <h1 className="text-3xl font-bold text-white mb-1">Reviews</h1>
        <p className="text-white/70">Manage and respond to customer reviews.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-[14px] p-5 text-center" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{reviews.length}</p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Reviews</p>
        </div>
        <div className="rounded-[14px] p-5 text-center" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-center gap-1">
            <p className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{avgRating.toFixed(1)}</p>
            <StarIcon className="w-6 h-6" style={{ color: '#C9902E' }} filled />
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Average Rating</p>
        </div>
        <div className="rounded-[14px] p-5 text-center" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <p className="text-3xl font-bold" style={{ color: '#6E8B5E' }}>{reviews.filter((r) => r.rating >= 4).length}</p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Positive (4-5★)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: 'var(--color-text-secondary)' }} />
          <input type="search" placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-[48px] pl-11 pr-4 rounded-[10px] text-base focus:outline-none focus:ring-2" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
        </div>
        <div className="flex gap-2">
          {(['newest', 'rating'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: sortBy === s ? 'var(--color-primary)' : 'var(--color-surface)', color: sortBy === s ? 'white' : 'var(--color-text-secondary)', border: `1px solid ${sortBy === s ? 'var(--color-primary)' : 'var(--color-border)'}` }}>
              {s === 'newest' ? 'Newest First' : 'Top Rated'}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-[16px] p-8 text-center" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading reviews...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[16px] p-8 text-center" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>No reviews found.</p>
          </div>
        ) : filtered.map((review) => (
          <div key={review.id} className="rounded-[14px] p-5" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)', borderLeft: '4px solid var(--color-primary)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
                  {review.userName?.charAt(0) ?? '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{review.userName}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <StarIcon key={s} className="w-4 h-4" style={{ color: s < review.rating ? '#C9902E' : 'var(--color-border)' }} filled={s < review.rating} />
                ))}
              </div>
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold mb-2" style={{ background: 'rgba(122,155,118,0.12)', color: 'var(--color-primary)' }}>{review.productName}</span>
            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{review.comment}</p>

            {review.sellerReply && replyTarget !== review.id && (
              <div className="mt-3 p-3 rounded-xl text-sm" style={{ background: 'rgba(122,155,118,0.08)', borderLeft: '3px solid var(--color-primary)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                  Your reply{review.repliedAt ? ` · ${new Date(review.repliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                </p>
                <p style={{ color: 'var(--color-text-secondary)' }}>{review.sellerReply}</p>
              </div>
            )}

            {replyTarget === review.id ? (
              <div className="mt-3">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={e => { setReplyText(e.target.value); setReplyError(''); }}
                  placeholder="Respond publicly to this customer…"
                  maxLength={1000}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 resize-vertical"
                  style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                  autoFocus
                />
                {replyError && (
                  <p className="text-xs mt-1 font-medium" style={{ color: 'var(--color-error)' }}>{replyError}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { setReplyTarget(null); setReplyError(''); }} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }}>Cancel</button>
                  <button onClick={submitReply} disabled={replyMutation.isPending} className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'var(--color-primary)' }}>
                    {replyMutation.isPending ? 'Saving…' : 'Publish Reply'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => openReply(review)} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: review.sellerReply ? 'var(--color-text-secondary)' : 'var(--color-primary)' }}>
                {review.sellerReply ? <><EditIcon className="w-3.5 h-3.5" /> Edit reply</> : <><CheckCircleIcon className="w-3.5 h-3.5" /> Respond</>}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
