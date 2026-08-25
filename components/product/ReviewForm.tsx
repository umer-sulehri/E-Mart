'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export interface ReviewFormProps {
  productSlug?: string;
  productName?: string;
  onSuccess?: () => void;
  className?: string;
}

const ReviewForm = React.forwardRef<HTMLFormElement, ReviewFormProps>(
  ({ productSlug, productName, onSuccess, className }, ref) => {
    const [rating, setRating] = React.useState(0);
    const [hoveredRating, setHoveredRating] = React.useState(0);
    const [title, setTitle] = React.useState('');
    const [comment, setComment] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const { isAuthenticated } = useAuthStore();

    const validate = (): boolean => {
      const newErrors: Record<string, string> = {};

      if (rating === 0) {
        newErrors.rating = 'Please select a rating';
      }
      if (title.trim().length < 3) {
        newErrors.title = 'Title must be at least 3 characters';
      }
      if (comment.trim().length < 10) {
        newErrors.comment = 'Comment must be at least 10 characters';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;
      if (!productSlug) {
        toast.error('Unable to submit review');
        return;
      }

      setIsSubmitting(true);

      try {
        const res = await fetch(
          `/api/v1/products/${encodeURIComponent(productSlug)}/reviews`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, title, comment }),
          }
        );

        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to submit review');
        }

        toast.success(
          productName
            ? `Review submitted for ${productName}! Thank you.`
            : 'Review submitted successfully! Thank you.'
        );

        setRating(0);
        setTitle('');
        setComment('');
        setErrors({});
        onSuccess?.();
      } catch (err: any) {
        toast.error(err.message || 'Something went wrong. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    const displayRating = hoveredRating || rating;

    if (!isAuthenticated) {
      return (
        <div className="rounded-xl border border-muted-100 bg-muted-50 p-6 text-center">
          <p className="text-sm text-secondary-700 mb-3">
            Please log in to write a review.
          </p>
          <a
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Login to review
          </a>
        </div>
      );
    }

    return (
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn('space-y-5', className)}
      >
        <h3 className="font-heading text-lg font-bold text-secondary-800">
          Write a Review
        </h3>

        {/* Star Rating */}
        <div>
          <label className="mb-2 block text-sm font-medium text-secondary-800">
            Your Rating
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => {
                  setRating(star);
                  setErrors((prev) => ({ ...prev, rating: '' }));
                }}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                <Star
                  size={24}
                  className={cn(
                    'transition-colors',
                    star <= displayRating
                      ? 'fill-warning text-warning'
                      : 'fill-none text-muted-300'
                  )}
                />
              </button>
            ))}
            {displayRating > 0 && (
              <span className="ml-2 text-sm text-muted-600">
                {displayRating === 1 && 'Poor'}
                {displayRating === 2 && 'Fair'}
                {displayRating === 3 && 'Good'}
                {displayRating === 4 && 'Very Good'}
                {displayRating === 5 && 'Excellent'}
              </span>
            )}
          </div>
          {errors.rating && (
            <p className="mt-1.5 text-xs text-danger">{errors.rating}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="review-title"
            className="mb-1.5 block text-sm font-medium text-secondary-800"
          >
            Review Title
          </label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErrors((prev) => ({ ...prev, title: '' }));
            }}
            placeholder="Summarize your experience"
            className={cn(
              'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-secondary-800',
              'placeholder:text-muted-400',
              'transition-colors',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
              errors.title
                ? 'border-danger focus:border-danger focus:ring-danger/20'
                : 'border-muted-200'
            )}
          />
          {errors.title && (
            <p className="mt-1.5 text-xs text-danger">{errors.title}</p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label
            htmlFor="review-comment"
            className="mb-1.5 block text-sm font-medium text-secondary-800"
          >
            Your Review
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setErrors((prev) => ({ ...prev, comment: '' }));
            }}
            placeholder="Tell others about your experience with this product..."
            rows={4}
            className={cn(
              'w-full resize-none rounded-lg border bg-white px-3.5 py-2.5 text-sm text-secondary-800',
              'placeholder:text-muted-400',
              'transition-colors',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
              errors.comment
                ? 'border-danger focus:border-danger focus:ring-danger/20'
                : 'border-muted-200'
            )}
          />
          {errors.comment && (
            <p className="mt-1.5 text-xs text-danger">{errors.comment}</p>
          )}
          <p className="mt-1 text-xs text-muted-500">
            {comment.length}/500 characters
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Submit Review
        </Button>
      </form>
    );
  }
);

ReviewForm.displayName = 'ReviewForm';

export default ReviewForm;
