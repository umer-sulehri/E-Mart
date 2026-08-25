'use client';

import { useState } from 'react';
import { Star, MessageSquare, Send } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  productName: string;
  comment: string;
  reply?: string;
}

const mockReviews: Review[] = [
  { id: '1', userName: 'Ahmed Khan', userAvatar: '', rating: 5, date: '2026-08-20', productName: 'Organic Basmati Rice 5kg', comment: 'Excellent quality rice! The grains are long and aromatic. Perfect for biryani. Will definitely order again.' },
  { id: '2', userName: 'Fatima Ali', userAvatar: '', rating: 4, date: '2026-08-18', productName: 'Fresh Milk 1L', comment: 'Good quality milk, delivered fresh. Slight delay in delivery but overall satisfied with the product.' },
  { id: '3', userName: 'Hassan Raza', userAvatar: '', rating: 5, date: '2026-08-15', productName: 'Premium Olive Oil 500ml', comment: 'Authentic olive oil, great for cooking and salads. Packaging was secure and well sealed.' },
  { id: '4', userName: 'Sara Malik', userAvatar: '', rating: 3, date: '2026-08-12', productName: 'Alphonso Mangoes 1kg', comment: 'Mangoes were okay but a couple were overripe. Expected better quality for the price.' },
  { id: '5', userName: 'Usman Tariq', userAvatar: '', rating: 5, date: '2026-08-08', productName: 'Chicken Breast Boneless 1kg', comment: 'Fresh and clean chicken breast. Perfect portion sizes. Will order again for sure!', reply: 'Thank you Usman! We source our chicken from local farms to ensure freshness.' },
  { id: '6', userName: 'Ayesha Noor', userAvatar: '', rating: 4, date: '2026-08-21', productName: 'Free Range Eggs (12 pack)', comment: 'Good quality eggs, all intact on delivery. The yolks are nice and orange.' },
  { id: '7', userName: 'Bilal Shah', userAvatar: '', rating: 2, date: '2026-08-19', productName: 'Whole Wheat Bread', comment: 'Bread was stale upon arrival. Expected fresher product. Please improve packaging.' },
  { id: '8', userName: 'Zainab Hussain', userAvatar: '', rating: 5, date: '2026-08-17', productName: 'Atlantic Salmon Fillet 500g', comment: 'Restaurant quality salmon! Super fresh and well-packed with ice. Impressed!', reply: 'Thank you for your kind words Zainab! Our seafood is delivered fresh daily.' },
  { id: '9', userName: 'Omar Farooq', userAvatar: '', rating: 4, date: '2026-08-14', productName: 'Premium Olive Oil 500ml', comment: 'Good product, authentic taste. The price is a bit high but quality justifies it.' },
  { id: '10', userName: 'Nadia Iqbal', userAvatar: '', rating: 5, date: '2026-08-22', productName: 'Organic Basmati Rice 5kg', comment: 'Best rice I have bought online. The fragrance is amazing when cooking. 10/10 recommend.' },
];

const filterTabs = ['All', '5-star', '4-star', '3-star', '2-star', '1-star'];

export default function SellerReviewsPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const filtered = mockReviews.filter((r) => {
    if (activeFilter === 'All') return true;
    const star = parseInt(activeFilter.charAt(0));
    return r.rating === star;
  });

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: mockReviews.filter((r) => r.rating === star).length,
    percentage: (mockReviews.filter((r) => r.rating === star).length / mockReviews.length) * 100,
  }));

  const averageRating = mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length;

  const handleReply = (reviewId: string) => {
    if (replyText.trim()) {
      alert(`Reply sent to review ${reviewId}`);
      setReplyingTo(null);
      setReplyText('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-secondary-800">Reviews</h2>
        <p className="text-sm text-muted-500">Manage customer reviews and respond to feedback</p>
      </div>

      {/* Rating Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Average Rating */}
        <div className="flex items-center gap-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="text-center">
            <p className="text-5xl font-bold text-secondary-800">{averageRating.toFixed(1)}</p>
            <div className="mt-2 flex items-center justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${star <= Math.round(averageRating) ? 'fill-warning text-warning' : 'text-muted-300'}`}
                />
              ))}
            </div>
            <p className="mt-1 text-sm text-muted-500">{mockReviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-2">
            {ratingDistribution.map((dist) => (
              <div key={dist.star} className="flex items-center gap-3">
                <span className="w-12 text-sm text-muted-600">{dist.star} star</span>
                <div className="flex-1 overflow-hidden rounded-full bg-muted-100">
                  <div
                    className="h-2.5 rounded-full bg-warning"
                    style={{ width: `${dist.percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm text-muted-600">{dist.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeFilter === tab
                    ? 'bg-primary text-white'
                    : 'bg-muted-100 text-muted-600 hover:bg-muted-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filtered.map((review) => (
          <div key={review.id} className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                  {review.userName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-secondary-800">{review.userName}</p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= review.rating ? 'fill-warning text-warning' : 'text-muted-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-500">{formatDate(review.date)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-primary">{review.productName}</p>
                  <p className="mt-2 text-sm text-muted-700">{review.comment}</p>

                  {/* Existing reply */}
                  {review.reply && (
                    <div className="mt-3 rounded-lg bg-muted-50 p-3">
                      <p className="text-xs font-semibold text-secondary-800">Your Reply</p>
                      <p className="mt-1 text-sm text-muted-600">{review.reply}</p>
                    </div>
                  )}

                  {/* Reply form */}
                  {replyingTo === review.id && !review.reply && (
                    <div className="mt-3">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        className="w-full rounded-lg border border-muted-200 bg-white px-3.5 py-2.5 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => handleReply(review.id)}>
                          <Send className="h-3.5 w-3.5" />
                          Send Reply
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyText(''); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!review.reply && replyingTo !== review.id && (
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

        {filtered.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <Star className="mx-auto mb-3 h-10 w-10 text-muted-300" />
            <p className="text-sm text-muted-500">No reviews found for this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
