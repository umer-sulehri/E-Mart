'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import {
  ChevronRight,
  Home,
  Star,
  ThumbsUp,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  title: string;
  comment: string;
  productName: string;
  productSlug: string;
  productImage: string;
  date: string;
  helpful: number;
  helpfulByUser: boolean;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    userId: 'u1',
    userName: 'Ahmad Khan',
    userAvatar: '/images/reviewer-1.jpg',
    rating: 5,
    title: 'Excellent quality organic products',
    comment: 'I have been ordering from E-Mart for months now. The freshness of their fruits and vegetables is unmatched. Highly recommended!',
    productName: 'Organic Mixed Fruit Basket',
    productSlug: 'organic-mixed-fruit-basket',
    productImage: '/images/product-thumb-1.webp',
    date: '2026-08-20',
    helpful: 12,
    helpfulByUser: false,
  },
  {
    id: '2',
    userId: 'u2',
    userName: 'Sara Malik',
    userAvatar: '/images/reviewer-2.jpg',
    rating: 4,
    title: 'Great service, fast delivery',
    comment: 'Ordered groceries at 10am and received them by 4pm the same day. The packaging was excellent and everything was fresh.',
    productName: 'Fresh Dairy Milk 1L',
    productSlug: 'fresh-dairy-milk',
    productImage: '/images/product-thumb-2.webp',
    date: '2026-08-18',
    helpful: 8,
    helpfulByUser: false,
  },
  {
    id: '3',
    userId: 'u3',
    userName: 'Ali Raza',
    userAvatar: '/images/reviewer-3.jpg',
    rating: 5,
    title: 'Best prices for organic produce',
    comment: 'Compared to other online stores, E-Mart offers the best prices for organic produce. The desi ghee is absolutely pure and authentic.',
    productName: 'Fresh Desi Ghee 1kg',
    productSlug: 'fresh-desi-ghee',
    productImage: '/images/product-thumb-3.webp',
    date: '2026-08-15',
    helpful: 15,
    helpfulByUser: true,
  },
  {
    id: '4',
    userId: 'u4',
    userName: 'Fatima Noor',
    userAvatar: '/images/reviewer-1.jpg',
    rating: 3,
    title: 'Good but delivery was delayed',
    comment: 'Products were fresh and good quality, but the delivery was delayed by a day. Expected same-day delivery as promised.',
    productName: 'Whole Wheat Bread Pack',
    productSlug: 'whole-wheat-bread',
    productImage: '/images/product-thumb-1.webp',
    date: '2026-08-12',
    helpful: 3,
    helpfulByUser: false,
  },
  {
    id: '5',
    userId: 'u5',
    userName: 'Hassan Ahmed',
    userAvatar: '/images/reviewer-2.jpg',
    rating: 5,
    title: 'My go-to grocery store',
    comment: 'E-Mart has become my family\'s go-to grocery store. The quality is consistent and the customer support is very responsive.',
    productName: 'Organic Green Tea Pack',
    productSlug: 'organic-green-tea',
    productImage: '/images/product-thumb-2.webp',
    date: '2026-08-10',
    helpful: 20,
    helpfulByUser: false,
  },
];

const ITEMS_PER_PAGE = 4;

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [overallRating, setOverallRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchReviews() {
      try {
        const res = await fetch('/api/v1/reviews');
        const json = await res.json();
        if (!cancelled && json.success && json.data?.length) {
          setReviews(json.data);
          calculateStats(json.data);
        } else {
          if (!cancelled) {
            setReviews(MOCK_REVIEWS);
            calculateStats(MOCK_REVIEWS);
          }
        }
      } catch {
        if (!cancelled) {
          setReviews(MOCK_REVIEWS);
          calculateStats(MOCK_REVIEWS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    function calculateStats(data: Review[]) {
      const total = data.length;
      const avg = total > 0 ? data.reduce((sum, r) => sum + r.rating, 0) / total : 0;
      setTotalReviews(total);
      setOverallRating(Math.round(avg * 10) / 10);
    }

    fetchReviews();
    return () => { cancelled = true; };
  }, []);

  const filteredReviews = reviews.filter(
    (r) => ratingFilter === 0 || r.rating === ratingFilter
  );

  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const filteredTotalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);

  const handleHelpful = async (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          return {
            ...r,
            helpful: r.helpfulByUser ? r.helpful - 1 : r.helpful + 1,
            helpfulByUser: !r.helpfulByUser,
          };
        }
        return r;
      })
    );

    try {
      const res = await fetch(`/api/v1/reviews/${reviewId}/helpful`, {
        method: 'POST',
      });
      if (res.status === 401) {
        toast.error('Please sign in to mark reviews as helpful');
      } else if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to update review');
      }
    } catch {
      // keep optimistic local state
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative bg-secondary-800 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <h1 className="font-heading text-3xl font-bold text-white md:text-4xl">
            Customer Reviews
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">Reviews</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-muted-100 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
            <div className="text-center">
              <p className="text-5xl font-bold text-secondary-800">{overallRating}</p>
              <div className="mt-2 flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={
                      i < Math.round(overallRating)
                        ? 'fill-warning text-warning'
                        : 'text-muted-300'
                    }
                  />
                ))}
              </div>
              <p className="mt-1 text-sm text-muted-500">
                Based on {totalReviews} reviews
              </p>
            </div>

            {/* Rating filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setRatingFilter(0); setCurrentPage(1); }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  ratingFilter === 0
                    ? 'bg-primary text-white'
                    : 'bg-muted-100 text-secondary-700 hover:bg-muted-200'
                }`}
              >
                All
              </button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => { setRatingFilter(rating); setCurrentPage(1); }}
                  className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    ratingFilter === rating
                      ? 'bg-primary text-white'
                      : 'bg-muted-100 text-secondary-700 hover:bg-muted-200'
                  }`}
                >
                  {rating}
                  <Star size={14} className="fill-current" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews List */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted-100" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 rounded bg-muted-100" />
                      <div className="h-3 w-20 rounded bg-muted-100" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-5 w-3/4 rounded bg-muted-100" />
                    <div className="h-4 w-full rounded bg-muted-100" />
                    <div className="h-4 w-2/3 rounded bg-muted-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MessageSquare size={48} className="mb-4 text-muted-300" />
              <h3 className="font-heading text-xl font-bold text-secondary-800">
                No reviews found
              </h3>
              <p className="mt-2 text-sm text-muted-500">
                Try a different rating filter.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {paginatedReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-full">
                        <ImageWithFallback
                          src={review.userAvatar}
                          alt={review.userName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-secondary-800">
                          {review.userName}
                        </p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={
                                i < review.rating
                                  ? 'fill-warning text-warning'
                                  : 'text-muted-300'
                              }
                            />
                          ))}
                          <span className="ml-1 text-xs text-muted-500">
                            {new Date(review.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="mt-4 font-heading text-base font-bold text-secondary-800">
                    {review.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-secondary-600">
                    {review.comment}
                  </p>

                  {/* Product link */}
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted-50 p-3">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white">
                      <ImageWithFallback
                        src={review.productImage}
                        alt={review.productName}
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    </div>
                    <Link
                      href={`/products/${review.productSlug}`}
                      className="text-sm font-medium text-primary hover:text-primary-500 transition-colors"
                    >
                      {review.productName}
                    </Link>
                  </div>

                  {/* Helpful */}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleHelpful(review.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        review.helpfulByUser
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-500 hover:bg-muted-100'
                      }`}
                    >
                      <ThumbsUp size={14} />
                      Helpful ({review.helpful})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {filteredTotalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-muted-200 text-secondary-800 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:text-muted-300"
              >
                &lt;
              </button>
              {Array.from({ length: filteredTotalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'border-primary bg-primary text-white'
                        : 'border-muted-200 text-secondary-800 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(filteredTotalPages, p + 1))}
                disabled={currentPage === filteredTotalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-muted-200 text-secondary-800 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:text-muted-300"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
