'use client';

import { useState } from 'react';
import { mockReviews } from '@/lib/mock/orders';
import { mockProducts } from '@/lib/mock/products';
import { StarIcon, SearchIcon } from '@/components/icons';

export default function SellerReviewsPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'rating'>('newest');

  const reviews = [
    { id: 'r1', userName: 'Ahmed Khan', productName: 'Wireless Mouse', rating: 5, comment: 'Excellent quality! Works perfectly with my laptop.', createdAt: '2025-02-10', productId: 'prod-1' },
    { id: 'r2', userName: 'Sara Malik', productName: 'Notebook Set', rating: 4, comment: 'Good quality paper. Fast delivery.', createdAt: '2025-02-08', productId: 'prod-2' },
    { id: 'r3', userName: 'Ali Hassan', productName: 'Protein Bar Pack', rating: 5, comment: 'Amazing taste! Will definitely order again.', createdAt: '2025-02-05', productId: 'prod-3' },
    { id: 'r4', userName: 'Fatima Ali', productName: 'Power Bank', rating: 4, comment: 'Good battery life. Slightly heavy but works well.', createdAt: '2025-02-01', productId: 'prod-4' },
    { id: 'r5', userName: 'Usman Raza', productName: 'Bluetooth Speaker', rating: 3, comment: 'Sound quality is average. Expected better for the price.', createdAt: '2025-01-28', productId: 'prod-5' },
  ];

  const filtered = reviews
    .filter(r => !search || r.productName.toLowerCase().includes(search.toLowerCase()) || r.userName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'newest' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : b.rating - a.rating);

  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

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
          <p className="text-3xl font-bold" style={{ color: '#6E8B5E' }}>{reviews.filter(r => r.rating >= 4).length}</p>
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
        {filtered.length === 0 ? (
          <div className="rounded-[16px] p-8 text-center" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>No reviews found.</p>
          </div>
        ) : filtered.map(review => (
          <div key={review.id} className="rounded-[14px] p-5" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)', borderLeft: '4px solid var(--color-primary)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
                  {review.userName.charAt(0)}
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
          </div>
        ))}
      </div>
    </div>
  );
}
