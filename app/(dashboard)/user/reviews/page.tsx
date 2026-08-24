'use client';

import { useState, useMemo } from 'react';
import { useUserReviews, useCreateReview, useUpdateReview, useDeleteReview, type ReviewWithProduct } from '@/hooks/useReviews';
import { useProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { useToast } from '@/components/ui/Toast';
import { StarIcon, SearchIcon, EditIcon, TrashIcon } from '@/components/icons';

interface ReviewTarget {
  productId: string;
  slug: string;
  name: string;
}

export default function UserReviewsPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [editReview, setEditReview] = useState<ReviewWithProduct | null>(null);
  const [target, setTarget] = useState<ReviewTarget | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  const { data: reviews, isLoading } = useUserReviews();
  const { data: ordersData } = useOrders(1, 100);
  const createReview = useCreateReview('');
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();

  // Products purchased AND delivered are eligible for review.
  const deliveredProductIds = useMemo(
    () =>
      new Set(
        (ordersData?.orders ?? [])
          .filter((o) => o.status === 'delivered')
          .flatMap((o) => o.items.map((i) => i.productId)),
      ),
    [ordersData],
  );

  const reviewedProductIds = useMemo(
    () => new Set((reviews ?? []).map((r) => r.productId)),
    [reviews],
  );

  const eligibleIds = useMemo(
    () =>
      [...deliveredProductIds].filter(
        (id) =>
          !reviewedProductIds.has(id) &&
          !(reviews ?? []).some((r) => r.productId === id),
      ),
    [deliveredProductIds, reviewedProductIds, reviews],
  );
  const { data: productsData } = useProducts(
    { ids: eligibleIds },
    1,
    Math.max(eligibleIds.length, 1),
    { enabled: eligibleIds.length > 0 },
  );
  const eligibleProducts = useMemo(
    () => (productsData?.products ?? []).slice(0, 4),
    [productsData],
  );

  const myReviews = reviews ?? [];
  const filtered = myReviews.filter((r) => !search || r.productName?.toLowerCase().includes(search.toLowerCase()));

  const openCreate = (product: ReviewTarget) => {
    setEditReview(null);
    setTarget(product);
    setRating(0);
    setComment('');
    setShowWriteReview(true);
  };

  const openEdit = (review: ReviewWithProduct) => {
    setEditReview(review);
    setTarget(null);
    setRating(review.rating);
    setComment(review.comment);
    setShowWriteReview(true);
  };

  const handleDelete = async (review: ReviewWithProduct) => {
    if (!window.confirm(`Delete your review of "${review.productName ?? 'this product'}"?`)) return;
    try {
      await deleteReview.mutateAsync(review.id);
      toast.showToast('Review deleted.', 'success');
    } catch (err) {
      toast.showToast(err instanceof Error ? err.message : 'Failed to delete review.', 'error');
    }
  };

  const handleSubmit = async () => {
    if (rating < 1) {
      toast.showToast('Please select a star rating.', 'error');
      return;
    }
    if (comment.trim().length < 10) {
      toast.showToast('Review must be at least 10 characters.', 'error');
      return;
    }
    try {
      if (editReview) {
        await updateReview.mutateAsync({ id: editReview.id, rating, comment: comment.trim() });
        toast.showToast('Review updated.', 'success');
      } else if (target) {
        await createReview.mutateAsync({
          rating,
          comment: comment.trim(),
          slug: target.slug,
        });
        toast.showToast('Review submitted — thank you!', 'success');
      }
      setShowWriteReview(false);
      setEditReview(null);
      setTarget(null);
    } catch (err) {
      toast.showToast(err instanceof Error ? err.message : 'Failed to save review.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[16px] p-6" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 10px 25px rgba(255,196,63,0.3)' }}>
        <h1 className="text-3xl font-bold text-white mb-1">My Reviews</h1>
        <p className="text-white/70">Manage your product reviews.</p>
      </div>

      {/* Write Review Section */}
      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Write a Review</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>Products you&apos;ve purchased that are eligible for review:</p>
        {eligibleProducts.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No eligible products found. Complete an order to leave a review.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {eligibleProducts.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                <img src={p.images[0]} alt={p.name} loading="lazy" className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{p.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Rs {p.price.toLocaleString()}</p>
                </div>
                <button onClick={() => openCreate({ productId: p.id, slug: p.slug, name: p.name })} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--color-primary)', color: 'white' }}>Review</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Reviews */}
      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '2px solid var(--color-primary)' }}>
          <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Review History ({myReviews.length})</h3>
          <div className="relative max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-text-secondary)' }} />
            <input type="search" placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-[40px] pl-9 pr-3 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
          </div>
        </div>
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>Loading reviews...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>No reviews found.</p>
          ) : filtered.map((review) => (
            <div key={review.id} className="rounded-xl p-4" style={{ background: 'var(--color-bg)', borderLeft: '4px solid var(--color-primary)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(255,196,63,0.12)', color: 'var(--color-primary)' }}>{review.productName}</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <StarIcon key={s} className="w-3.5 h-3.5" style={{ color: s < review.rating ? '#C9902E' : 'var(--color-border)' }} filled={s < review.rating} />
                  ))}
                </div>
              </div>
              <p className="text-sm mb-3" style={{ color: 'var(--color-text-primary)' }}>{review.comment}</p>
              <div className="flex gap-2">
                <button onClick={() => openEdit(review)} disabled={updateReview.isPending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <EditIcon className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => handleDelete(review)} disabled={deleteReview.isPending} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: 'rgba(182,92,75,0.1)', color: '#B65C4B' }}>
                  <TrashIcon className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Write/Edit Review Modal */}
      {showWriteReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowWriteReview(false)}>
          <div className="w-full max-w-md rounded-[16px] p-6" style={{ background: 'var(--color-bg)' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{editReview ? 'Edit Review' : 'Write Review'}</h3>
            {(editReview?.productName || target?.name) && (
              <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>{editReview?.productName ?? target?.name}</p>
            )}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} type="button" aria-label={`${star} star${star > 1 ? 's' : ''}`} onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(0)} onClick={() => setRating(star)}>
                    <StarIcon className="w-8 h-8 transition-colors" style={{ color: star <= (hoveredStar || rating) ? '#C9902E' : 'var(--color-border)' }} filled={star <= (hoveredStar || rating)} />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Comment</label>
              <textarea rows={4} maxLength={500} value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 resize-vertical" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{comment.length}/500 characters</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowWriteReview(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={createReview.isPending || updateReview.isPending}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--color-primary)' }}
              >
                {createReview.isPending || updateReview.isPending ? 'Saving…' : editReview ? 'Update' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
