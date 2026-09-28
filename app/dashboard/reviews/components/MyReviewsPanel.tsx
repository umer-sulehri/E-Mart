'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, MessagesSquare } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import { usePageParam } from '@/hooks/usePageParam';
import toast from 'react-hot-toast';
import ReviewCard from './ReviewCard';
import ReviewFormModal from './ReviewFormModal';
import type { MyReviewData } from './types';

interface MyReviewsPanelProps {
  /** 'pending' | 'approved' | 'rejected' | 'flagged' | '' (all). Comma lists supported. */
  status?: string;
  /** Bump this to force a refetch (e.g. after creating a review elsewhere). */
  refreshKey?: number;
}

interface Meta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const PAGE_SIZE = 8;

export default function MyReviewsPanel({
  status = '',
  refreshKey = 0,
}: MyReviewsPanelProps) {
  // `usePageParam` reads `useSearchParams`, which must sit behind Suspense.
  return (
    <Suspense>
      <MyReviewsPanelContent status={status} refreshKey={refreshKey} />
    </Suspense>
  );
}

function MyReviewsPanelContent({
  status = '',
  refreshKey = 0,
}: MyReviewsPanelProps) {
  const [reviews, setReviews] = useState<MyReviewData[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('recent');

  const [editing, setEditing] = useState<MyReviewData | null>(null);
  const [deleting, setDeleting] = useState<MyReviewData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Re-ordering the list makes the current page meaningless, so the page resets
  // to 1 whenever the sort or the status tab changes.
  const { page, setPage } = usePageParam({
    resetOn: [sort, status],
    totalPages: meta?.totalPages,
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sort,
      });
      if (status) params.set('status', status);

      const res = await fetch(`/api/v1/auth/reviews?${params.toString()}`);
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || 'Failed to load reviews');
        return;
      }
      setReviews(json.data || []);
      setMeta(json.meta || null);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [page, sort, status]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingId(deleting.id);
    try {
      const res = await fetch(`/api/v1/reviews/${deleting.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || 'Failed to delete review');
        return;
      }
      toast.success('Review deleted');
      setDeleting(null);
      load();
    } catch {
      toast.error('Failed to delete review');
    } finally {
      setDeletingId(null);
    }
  };

  const changeSort = (value: string) => {
    setSort(value);
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton variant="rectangle" height={130} className="w-full" />
        <Skeleton variant="rectangle" height={130} className="w-full" />
        <Skeleton variant="rectangle" height={130} className="w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {meta && meta.totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-500">
            {meta.totalItems} review{meta.totalItems > 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="review-sort" className="text-sm text-muted-500">
              Sort:
            </label>
            <select
              id="review-sort"
              value={sort}
              onChange={(e) => changeSort(e.target.value)}
              className="rounded-lg border border-muted-200 bg-white px-3 py-1.5 text-sm text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="recent">Most recent</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
            </select>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-xl bg-white px-8 py-12 text-center shadow-sm">
          {status ? (
            <Clock className="mx-auto h-10 w-10 text-muted-300" />
          ) : (
            <MessagesSquare className="mx-auto h-10 w-10 text-muted-300" />
          )}
          <p className="mt-4 font-semibold text-secondary-800">
            {status ? 'Nothing here yet' : 'No reviews yet'}
          </p>
          <p className="mt-1 text-sm text-muted-500">
            {status
              ? 'Reviews you submit while awaiting approval will appear here.'
              : 'Products from your delivered orders appear in the Ordered Products tab for review.'}
          </p>
          {!status && (
            <Link href="/products">
              <Button variant="primary" className="mt-4">
                Browse Products
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={review.status === 'rejected' ? () => {} : setEditing}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="pt-1">
          <Pagination
            variant="table"
            currentPage={page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
            totalItems={meta.totalItems}
            itemsPerPage={PAGE_SIZE}
            itemLabel="reviews"
            className="mt-0"
          />
        </div>
      )}

      <ReviewFormModal
        open={!!editing}
        review={editing}
        product={null}
        onClose={() => setEditing(null)}
        onSuccess={load}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete this review?"
        message="This permanently removes your review. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deletingId === deleting?.id}
      />
    </div>
  );
}