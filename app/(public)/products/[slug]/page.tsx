'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useProductReviews, useCreateReview } from '@/hooks/useReviews';
import { StarIcon, CheckCircleIcon } from '@/components/icons';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { useCartStore } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';
import type { Product } from '@/lib/types';

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ProductDetailPageInner params={params} />;
}

function ProductDetailPageInner({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = React.useState<string>('');

  React.useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const { data: product, isLoading, isError } = useProduct(slug);
  const { data: productsData } = useProducts({ category: product?.categoryId }, 1, 8);
  const { data: reviewsData } = useProductReviews(slug);
  const reviews = reviewsData?.reviews ?? [];
  const canReview = reviewsData?.canReview ?? false;
  const createReview = useCreateReview(slug);
  const { isAuthenticated } = useAuthStore();

  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const relatedProducts = (productsData?.products ?? []).filter((p) => p.id !== product?.id).slice(0, 4);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess(false);
    if (reviewRating === 0) { setReviewError('Please select a star rating'); return; }
    if (!reviewComment.trim()) { setReviewError('Please enter a comment'); return; }
    createReview.mutate(
      { rating: reviewRating, comment: reviewComment.trim() },
      {
        onSuccess: () => {
          setReviewSuccess(true);
          setReviewRating(0);
          setReviewComment('');
          setTimeout(() => setReviewSuccess(false), 3000);
        },
        onError: (err) => {
          setReviewError(err instanceof Error ? err.message : 'Failed to submit review');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-4 bg-surface-alt rounded w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-surface-alt rounded-[16px]" />
            <div className="space-y-4">
              <div className="h-4 bg-surface-alt rounded w-24" />
              <div className="h-8 bg-surface-alt rounded w-3/4" />
              <div className="h-6 bg-surface-alt rounded w-40" />
              <div className="h-10 bg-surface-alt rounded w-32" />
              <div className="h-20 bg-surface-alt rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-surface rounded-full flex items-center justify-center">
          <span className="text-4xl">?</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-3">Product Not Found</h1>
        <p className="text-text-secondary mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link href="/products">
          <span className="inline-flex items-center justify-center h-[48px] px-6 bg-primary text-text-inverse font-semibold rounded-[10px] hover:bg-primary-dark transition-colors">
            Browse All Products
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ProductDetailClient product={product} />

      {/* Review Submission Form */}
      <section className="mt-12">
        <div className="bg-surface border border-border rounded-[16px] p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">Write a Review</h2>
          {!isAuthenticated ? (
            <p className="text-sm text-text-secondary">
              Please <Link href="/login" className="font-semibold text-primary-dark hover:underline">log in</Link> to submit a review.
            </p>
          ) : !canReview ? (
            <p className="text-sm text-text-secondary">
              Only customers who have purchased this product can leave a review. Reviews are verified
              against your order history to keep feedback authentic.
            </p>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block mb-1.5 text-sm font-semibold text-text-primary">Your Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <StarIcon
                        className="w-7 h-7 text-warning cursor-pointer"
                        filled={s <= (hoverRating || reviewRating)}
                      />
                    </button>
                  ))}
                  {reviewRating > 0 && (
                    <span className="text-sm text-text-secondary ml-2">{reviewRating}/5</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-semibold text-text-primary">Your Review</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  placeholder="Share your experience with this product..."
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all resize-none"
                  style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>
              {reviewError && (
                <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(182,92,75,0.1)', color: 'var(--color-error)', border: '1px solid var(--color-error)' }}>
                  {reviewError}
                </div>
              )}
              {reviewSuccess && (
                <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(110,139,94,0.15)', color: '#6E8B5E' }}>
                  Review submitted successfully!
                </div>
              )}
              <button
                type="submit"
                disabled={createReview.isPending}
                className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
              >
                {createReview.isPending ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Reviews Section */}
      {reviews && reviews.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-text-primary mb-5">Customer Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Rating Summary */}
            <div className="bg-surface border border-border rounded-[12px] p-6 text-center">
              <p className="text-5xl font-extrabold text-text-primary mb-2">{product.rating}</p>
              <div className="flex items-center justify-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarIcon key={s} className="w-5 h-5 text-warning" filled={s <= Math.round(product.rating)} />
                ))}
              </div>
              <p className="text-sm text-text-secondary">{product.reviewCount} reviews</p>
            </div>
            {/* Review List */}
            <div className="md:col-span-2 flex flex-col gap-4">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="bg-surface border border-border rounded-[12px] p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary-dark">
                      {review.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary">{review.userName}</p>
                        {review.verified && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                            <CheckCircleIcon className="w-3 h-3" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <StarIcon key={s} className="w-3 h-3 text-warning" filled={s <= review.rating} />
                        ))}
                        <span className="text-xs text-text-secondary ml-1">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{review.comment}</p>
                  {review.sellerReply && (
                    <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--color-surface-alt)', borderLeft: '3px solid var(--color-primary)' }}>
                      <p className="text-xs font-bold mb-1 text-primary-dark">
                        Store reply{review.repliedAt ? ` · ${new Date(review.repliedAt).toLocaleDateString()}` : ''}
                      </p>
                      <p className="text-sm text-text-secondary">{review.sellerReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-text-primary mb-5">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map((rp) => (
              <RelatedCard key={rp.id} product={rp} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RelatedCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <div className="bg-surface border border-border rounded-[12px] overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] bg-surface-alt overflow-hidden">
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          {product.originalPrice && (
            <span className="absolute top-2 left-2 bg-error text-text-inverse text-xs font-bold px-2 py-1 rounded-full">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </span>
          )}
        </div>
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-semibold text-text-primary mb-1 line-clamp-2 hover:text-primary-dark transition-colors">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1 mb-2">
          <StarIcon className="w-4 h-4 text-warning" filled />
          <span className="text-xs text-text-secondary">{product.rating} ({product.reviewCount})</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base font-bold text-text-primary">Rs {product.price.toLocaleString()}</span>
          {product.originalPrice && (
            <span className="text-xs text-text-secondary line-through">Rs {product.originalPrice.toLocaleString()}</span>
          )}
        </div>
        <button onClick={() => addItem(product)} className="mt-auto w-full min-h-[48px] flex items-center justify-center gap-2 bg-primary text-text-inverse text-sm font-semibold rounded-[10px] hover:bg-primary-dark transition-colors">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
