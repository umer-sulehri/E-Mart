'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StarIcon } from '@/components/icons';
import { useProducts } from '@/hooks/useProducts';
import { useRecentReviews, useCreateReview } from '@/hooks/useReviews';
import { useAuthStore } from '@/lib/store/authStore';

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ReviewsPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: reviews, isLoading } = useRecentReviews(30);
  const { data: productsData } = useProducts({}, 1, 100, { enabled: isAuthenticated });

  const [productId, setProductId] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const productList = productsData?.products ?? [];
  const selectedProduct = productList.find((p) => p.id === productId);
  const createReview = useCreateReview(selectedProduct?.slug ?? '__none__');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!selectedProduct || rating === 0 || !reviewText.trim()) return;

    try {
      await createReview.mutateAsync({
        rating,
        comment: reviewText.trim(),
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setRating(0);
        setReviewText('');
        setProductId('');
      }, 2500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit review.');
    }
  };

  const displayRating = hoverRating || rating;
  const reviewList = reviews ?? [];

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

        {!isAuthenticated ? (
          <div className="py-4 text-center">
            <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Sign in to share your experience with a product.
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 rounded-[10px] text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #6B4E35, #3B2A1A)' }}
            >
              Sign In
            </Link>
          </div>
        ) : submitted ? (
          <div
            className="py-6 text-center rounded-lg"
            style={{ background: 'rgba(110,139,94,0.1)', color: 'var(--color-success)' }}
          >
            <p className="text-lg font-semibold">Thank you for your review!</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Your feedback has been submitted.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Product Select */}
            <div>
              <label htmlFor="review-product" className="block mb-2 font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                Product <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <select
                id="review-product"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
                aria-required="true"
                className="w-full px-4 py-3 rounded-[10px] text-sm bg-white focus:outline-none"
                style={{ border: '2px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                <option value="">Select a productâ€¦</option>
                {productList.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

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
                maxLength={500}
                placeholder="Tell us about your experience with this product..."
                className="w-full px-4 py-3 rounded-[10px] text-sm transition-all duration-300 bg-white focus:outline-none resize-vertical"
                style={{ border: '2px solid var(--color-border)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(184, 175, 6, 0.2)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                required
                aria-required="true"
              />
            </div>

            {submitError && (
              <p className="text-sm font-semibold" style={{ color: 'var(--color-error)' }} role="alert">{submitError}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={rating === 0 || !reviewText.trim() || !productId || createReview.isPending}
              className="w-full py-3.5 rounded-[10px] text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #6B4E35, #3B2A1A)' }}
            >
              {createReview.isPending ? 'Submittingâ€¦' : 'Submit Review'}
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
          All Reviews ({reviewList.length})
        </h2>

        {isLoading && (
          <p className="py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>Loading reviewsâ€¦</p>
        )}

        {!isLoading && reviewList.length === 0 && (
          <div className="text-center py-12">
            <StarIcon className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-primary)', opacity: 0.6 }} />
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>No reviews yet. Be the first to review!</p>
          </div>
        )}

        <div className="flex flex-col">
          {reviewList.map((review, i) => (
            <div
              key={review.id}
              className="flex gap-4 py-5"
              style={{ borderBottom: i < reviewList.length - 1 ? '1px solid #eee' : 'none' }}
            >
              {/* Avatar */}
              <div
                className="w-[60px] h-[60px] rounded-full flex-shrink-0 flex items-center justify-center text-lg font-bold"
                style={{
                  background: 'linear-gradient(135deg, #6B4E35, #3B2A1A)',
                  color: 'white',
                }}
              >
                {review.userName?.charAt(0)?.toUpperCase() || '?'}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{review.userName}</h3>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{timeAgo(review.createdAt)}</span>
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
                {review.productName && (
                  <span
                    className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold mb-2"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-text-primary))',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {review.productName}
                  </span>
                )}

                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                  {review.comment}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

