'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StarIcon } from '@/components/icons';

const mockReviews = [
  {
    id: 1,
    name: 'Ahmed Khan',
    product: 'Wireless Bluetooth Headphones',
    rating: 5,
    comment: 'Excellent sound quality and very comfortable to wear for long sessions. Battery life is impressive too!',
    date: '2 days ago',
    avatar: 'A',
  },
  {
    id: 2,
    name: 'Sara Malik',
    product: 'Organic Green Tea (50 bags)',
    rating: 4,
    comment: 'Good quality tea with a nice flavor. Packaging could be better but the product itself is great.',
    date: '5 days ago',
    avatar: 'S',
  },
  {
    id: 3,
    name: 'Ali Raza',
    product: 'Premium Protein Bar',
    rating: 5,
    comment: 'Amazing taste and texture. Perfect post-workout snack. Will definitely order again!',
    date: '1 week ago',
    avatar: 'A',
  },
  {
    id: 4,
    name: 'Fatima Noor',
    product: 'Notebook Set (3 Pack)',
    rating: 4,
    comment: 'Nice notebooks with good paper quality. The binding is solid. Recommended for students.',
    date: '2 weeks ago',
    avatar: 'F',
  },
];

export default function ReviewsPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !reviewText.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setRating(0);
      setReviewText('');
    }, 2000);
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Page Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Customer Reviews
        </h1>
        <div className="w-[100px] h-1 mx-auto rounded-full" style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))' }} />
      </div>

      {/* Review Form */}
      <div
        className="rounded-[20px] p-8 mb-8"
        style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}
      >
        <h2
          className="text-xl font-bold mb-6 pb-3"
          style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}
        >
          Write a Review
        </h2>

        {submitted ? (
          <div
            className="py-6 text-center rounded-lg"
            style={{ background: 'rgba(110,139,94,0.1)', color: 'var(--color-success)' }}
          >
            <p className="text-lg font-semibold">Thank you for your review!</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Your feedback has been submitted.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Star Rating */}
            <div>
              <label className="block mb-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                Your Rating <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform duration-200 hover:scale-110"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <StarIcon
                      className="w-9 h-9"
                      style={{ color: star <= displayRating ? '#ffc107' : '#ddd' }}
                      filled={star <= displayRating}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            {/* Review Text */}
            <div>
              <label className="block mb-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                Your Review <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                placeholder="Tell us about your experience with this product..."
                className="w-full px-4 py-3 rounded-[10px] text-sm transition-all duration-300 bg-white focus:outline-none resize-vertical"
                style={{ border: '2px solid var(--color-border)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(184, 175, 6, 0.2)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={rating === 0 || !reviewText.trim()}
              className="w-full py-3.5 rounded-[10px] text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
            >
              Submit Review
            </button>
          </form>
        )}
      </div>

      {/* Reviews List */}
      <div
        className="rounded-[20px] p-6"
        style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}
      >
        <h2
          className="text-xl font-bold mb-6 pb-3"
          style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}
        >
          All Reviews ({mockReviews.length})
        </h2>

        <div className="flex flex-col">
          {mockReviews.map((review, i) => (
            <div
              key={review.id}
              className="flex gap-4 py-5"
              style={{ borderBottom: i < mockReviews.length - 1 ? '1px solid #eee' : 'none' }}
            >
              {/* Avatar */}
              <div
                className="w-[60px] h-[60px] rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                  color: 'white',
                }}
              >
                {review.avatar}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{review.name}</h3>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{review.date}</span>
                </div>

                {/* Stars */}
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <StarIcon
                      key={s}
                      className="w-[18px] h-[18px]"
                      style={{ color: s < review.rating ? '#ffc107' : '#ddd' }}
                      filled={s < review.rating}
                    />
                  ))}
                </div>

                {/* Product Tag */}
                <span
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold mb-2"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-text-primary))',
                    color: 'var(--color-primary)',
                  }}
                >
                  {review.product}
                </span>

                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                  {review.comment}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State (hidden when reviews exist) */}
      {mockReviews.length === 0 && (
        <div className="text-center py-12">
          <StarIcon className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-primary)', opacity: 0.6 }} />
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>No reviews yet. Be the first to review!</p>
        </div>
      )}
    </div>
  );
}
