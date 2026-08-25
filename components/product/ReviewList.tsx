'use client';

import * as React from 'react';
import Image from 'next/image';
import { ThumbsUp, ChevronDown, PenLine } from 'lucide-react';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import { formatDate, cn } from '@/lib/utils';

export interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  helpfulCount: number;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export type SortOption = 'recent' | 'helpful';

export interface ReviewListProps {
  onWriteReview?: () => void;
  className?: string;
}

const mockReviews: Review[] = [
  {
    id: 'r1',
    userName: 'Sarah Johnson',
    rating: 5,
    title: 'Best quality I have ever tried!',
    comment:
      'These are hands down the best bananas I have purchased online. They arrived perfectly ripe and were bursting with flavor. My kids love them and we go through a bunch every week now. Will definitely be ordering again!',
    helpfulCount: 24,
    isVerifiedPurchase: true,
    createdAt: '2024-06-10T08:30:00Z',
  },
  {
    id: 'r2',
    userName: 'Ahmed Khan',
    rating: 4,
    title: 'Good quality, fast delivery',
    comment:
      'The bananas were fresh and tasty. Delivery was quick and the packaging kept them safe during transit. One or two were slightly bruised but overall a great purchase. Recommended for anyone looking for fresh organic produce.',
    helpfulCount: 18,
    isVerifiedPurchase: true,
    createdAt: '2024-06-08T14:20:00Z',
  },
  {
    id: 'r3',
    userName: 'Maria Garcia',
    rating: 5,
    title: 'Perfect for smoothies',
    comment:
      'I buy these every week for my morning smoothies. The natural sweetness is incredible and they blend perfectly. Much better than what I find at the local supermarket. The organic certification gives me peace of mind too.',
    helpfulCount: 15,
    isVerifiedPurchase: true,
    createdAt: '2024-06-05T10:15:00Z',
  },
  {
    id: 'r4',
    userName: 'David Chen',
    rating: 3,
    title: 'Decent but arrived slightly underripe',
    comment:
      'The quality is good once they ripen, but they arrived a bit too green for my liking. Had to wait a couple of days before eating. Flavor is nice when fully ripe though. Might order again knowing I need to plan ahead.',
    helpfulCount: 8,
    isVerifiedPurchase: true,
    createdAt: '2024-06-02T16:45:00Z',
  },
  {
    id: 'r5',
    userName: 'Fatima Ali',
    rating: 5,
    title: 'Kids absolutely love them!',
    comment:
      'My children are very picky about their fruit but they devour these bananas every time. Great value for organic produce and the convenience of home delivery is a game changer for our busy family. Highly recommended!',
    helpfulCount: 31,
    isVerifiedPurchase: true,
    createdAt: '2024-05-28T09:00:00Z',
  },
];

const ReviewList = React.forwardRef<HTMLDivElement, ReviewListProps>(
  ({ onWriteReview, className }, ref) => {
    const [sortBy, setSortBy] = React.useState<SortOption>('recent');
    const [showSortDropdown, setShowSortDropdown] = React.useState(false);
    const [helpfulClicked, setHelpfulClicked] = React.useState<Set<string>>(
      new Set()
    );

    const sortedReviews = React.useMemo(() => {
      const sorted = [...mockReviews];
      if (sortBy === 'helpful') {
        sorted.sort((a, b) => b.helpfulCount - a.helpfulCount);
      } else {
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return sorted;
    }, [sortBy]);

    const handleHelpful = (reviewId: string) => {
      setHelpfulClicked((prev) => {
        const next = new Set(prev);
        if (next.has(reviewId)) {
          next.delete(reviewId);
        } else {
          next.add(reviewId);
        }
        return next;
      });
    };

    const sortLabel = sortBy === 'recent' ? 'Most Recent' : 'Most Helpful';

    return (
      <div ref={ref} className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-heading text-lg font-bold text-secondary-800">
            Customer Reviews ({mockReviews.length})
          </h3>
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-700 transition-colors hover:border-muted-300"
              >
                {sortLabel}
                <ChevronDown size={14} />
              </button>
              {showSortDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortDropdown(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-muted-200 bg-white shadow-lg">
                    <button
                      onClick={() => {
                        setSortBy('recent');
                        setShowSortDropdown(false);
                      }}
                      className={cn(
                        'flex w-full items-center px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted-50',
                        sortBy === 'recent' && 'font-medium text-primary'
                      )}
                    >
                      Most Recent
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('helpful');
                        setShowSortDropdown(false);
                      }}
                      className={cn(
                        'flex w-full items-center px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted-50',
                        sortBy === 'helpful' && 'font-medium text-primary'
                      )}
                    >
                      Most Helpful
                    </button>
                  </div>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onWriteReview}
            >
              <PenLine size={14} />
              Write a Review
            </Button>
          </div>
        </div>

        {/* Reviews */}
        <div className="space-y-4">
          {sortedReviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-muted-100 bg-white p-5"
            >
              {/* User Info */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted-200">
                    {review.userAvatar ? (
                      <Image
                        src={review.userAvatar}
                        alt={review.userName}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-600">
                        {review.userName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-secondary-800">
                        {review.userName}
                      </span>
                      {review.isVerifiedPurchase && (
                        <span className="rounded-full bg-success-100 px-2 py-0.5 text-[10px] font-medium text-success-700">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
                <StarRating rating={review.rating} size="sm" />
              </div>

              {/* Review Content */}
              {review.title && (
                <h4 className="mb-1 text-sm font-bold text-secondary-800">
                  {review.title}
                </h4>
              )}
              <p className="text-sm leading-relaxed text-muted-700">
                {review.comment}
              </p>

              {/* Helpful Button */}
              <div className="mt-4 flex items-center">
                <button
                  onClick={() => handleHelpful(review.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    helpfulClicked.has(review.id)
                      ? 'bg-primary-100 text-primary'
                      : 'bg-muted-50 text-muted-600 hover:bg-muted-100'
                  )}
                >
                  <ThumbsUp size={12} />
                  Helpful ({review.helpfulCount + (helpfulClicked.has(review.id) ? 1 : 0)})
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

ReviewList.displayName = 'ReviewList';

export default ReviewList;
