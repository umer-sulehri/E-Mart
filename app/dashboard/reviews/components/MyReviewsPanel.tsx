'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, MessagesSquare } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
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
  const [reviews, setReviews] = useState<MyReviewData[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('recent');

  const [editing, setEditing] = useState<MyReviewData | null>(null);
  const [deleting, setDeleting] = useState<MyReviewData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    setPage(1);
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
        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasPreviousPage}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-500">
            Page {meta.currentPage} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
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