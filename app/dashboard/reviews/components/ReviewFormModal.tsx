'use client';

import { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { MyReviewData, ReviewableProduct } from './types';
import { ratingLabels } from './types';

interface ReviewFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Edit mode: the review being edited (pre-filled). */
  review?: MyReviewData | null;
  /** Create mode: the product this new review is for. */
  product?: ReviewableProduct | null;
}

const emptyForm = { rating: 0, title: '', comment: '' };

export default function ReviewFormModal({
  open,
  onClose,
  onSuccess,
  review,
  product,
}: ReviewFormModalProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [hovered, setHovered] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!review;

  useEffect(() => {
    if (open) {
      setRating(review?.rating ?? 0);
      setTitle(review?.title ?? '');
      setComment(review?.comment ?? '');
      setErrors({});
      setSubmitting(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, review]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!rating) next.rating = 'Please select a rating';
    if (title.trim().length < 3) next.title = 'Title must be at least 3 characters';
    if (comment.trim().length < 10)
      next.comment = 'Comment must be at least 10 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validate()) {
      toast.error('Please complete the required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { rating, title: title.trim(), comment: comment.trim() };
      const res = await fetch(
        isEdit
          ? `/api/v1/reviews/${review!.id}`
          : `/api/v1/products/${encodeURIComponent(product?.slug ?? '')}/reviews`,
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || (isEdit ? 'Failed to update review' : 'Failed to submit review'));
        return;
      }
      toast.success(isEdit ? 'Review updated and sent for approval' : 'Review submitted for approval');
      onSuccess();
      onClose();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hovered || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-form-title"
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-400 transition-colors hover:text-secondary"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 id="review-form-title" className="text-lg font-bold text-secondary-800">
          {isEdit ? 'Edit Review' : 'Write a Review'}
        </h3>
        <p className="mt-1 truncate text-sm text-muted-500">
          {isEdit ? `For ${review!.products?.name ?? 'this product'}` : `For ${product?.name ?? 'this product'}`}
        </p>
        <p className="mt-0.5 text-xs text-warning">
          {isEdit ? 'Submitting an edit re-queues your review for approval.' : 'Your review will be visible after an admin approves it.'}
        </p>

        <div className="mt-5">
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
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="p-0.5 transition-transform hover:scale-110"
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                <Star
                  size={26}
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
                {ratingLabels[displayRating]}
              </span>
            )}
          </div>
          {errors.rating && <p className="mt-1.5 text-xs text-danger">{errors.rating}</p>}
        </div>

        <div className="mt-4">
          <label htmlFor="review-form-title-input" className="mb-1.5 block text-sm font-medium text-secondary-800">
            Review Title
          </label>
          <input
            id="review-form-title-input"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.trim().length >= 3) {
                setErrors((prev) => ({ ...prev, title: '' }));
              }
            }}
            placeholder="Summarize your experience"
            className={cn(
              'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-secondary-800',
              'placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
              errors.title ? 'border-danger' : 'border-muted-200'
            )}
          />
          {errors.title && <p className="mt-1.5 text-xs text-danger">{errors.title}</p>}
        </div>

        <div className="mt-4">
          <label htmlFor="review-form-comment" className="mb-1.5 block text-sm font-medium text-secondary-800">
            Your Review
          </label>
          <textarea
            id="review-form-comment"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (e.target.value.trim().length >= 10) {
                setErrors((prev) => ({ ...prev, comment: '' }));
              }
            }}
            placeholder="Tell others about your experience with this product..."
            rows={4}
            className={cn(
              'w-full resize-none rounded-lg border bg-white px-3.5 py-2.5 text-sm text-secondary-800',
              'placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
              errors.comment ? 'border-danger' : 'border-muted-200'
            )}
          />
          {errors.comment && <p className="mt-1.5 text-xs text-danger">{errors.comment}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Update Review' : 'Submit Review'}
          </Button>
        </div>
      </div>
    </div>
  );
}