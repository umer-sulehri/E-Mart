'use client';

import { useState } from 'react';
import { useUserReviews } from '@/hooks/useReviews';
import { useProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { StarIcon, SearchIcon, EditIcon, TrashIcon, CheckCircleIcon } from '@/components/icons';

export default function UserReviewsPage() {
  const [search, setSearch] = useState('');
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [editReview, setEditReview] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  const { data: reviews, isLoading } = useUserReviews();
  const { data: ordersData } = useOrders(1, 100);
  const { data: productsData } = useProducts({}, 1, 50);
  const allProducts = productsData?.products ?? [];

  const deliveredProductIds = new Set(
    (ordersData?.orders ?? [])
      .filter((o) => o.status === 'delivered')
      .flatMap((o) => o.items.map((i) => i.productId))
  );
  const eligibleProducts = allProducts.filter((p) => deliveredProductIds.has(p.id)).slice(0, 4);

  const myReviews = reviews ?? [];
  const filtered = myReviews.filter((r: any) => !search || r.productName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="rounded-[16px] p-6" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 10px 25px rgba(122,155,118,0.3)' }}>
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
                <img src={p.images[0]} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{p.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Rs {p.price.toLocaleString()}</p>
                </div>
                <button onClick={() => { setEditReview(null); setShowWriteReview(true); setRating(0); setComment(''); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--color-primary)', color: 'white' }}>Review</button>
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
          ) : filtered.map((review: any) => (
            <div key={review.id} className="rounded-xl p-4" style={{ background: 'var(--color-bg)', borderLeft: '4px solid var(--color-primary)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(122,155,118,0.12)', color: 'var(--color-primary)' }}>{review.productName}</span>
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
                <button onClick={() => { setEditReview(review); setRating(review.rating); setComment(review.comment); setShowWriteReview(true); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <EditIcon className="w-3 h-3" /> Edit
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(182,92,75,0.1)', color: '#B65C4B' }}>
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
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>{editReview ? 'Edit Review' : 'Write Review'}</h3>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(0)} onClick={() => setRating(star)}>
                    <StarIcon className="w-8 h-8 transition-colors" style={{ color: star <= (hoveredStar || rating) ? '#C9902E' : 'var(--color-border)' }} filled={star <= (hoveredStar || rating)} />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Comment</label>
              <textarea rows={4} value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..." className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 resize-vertical" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{comment.length}/500 characters</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowWriteReview(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancel</button>
              <button onClick={() => setShowWriteReview(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--color-primary)' }}>{editReview ? 'Update' : 'Submit'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
