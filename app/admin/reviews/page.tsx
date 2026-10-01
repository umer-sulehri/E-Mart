'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import {
  Search,
  CheckCircle2,
  Flag,
  Trash2,
  Star,
  MessageSquare,
  Clock,
  ShieldAlert,
  ThumbsUp,
  AlertTriangle,
  Loader2,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import { PAGE_SIZE as ITEMS_PER_PAGE } from '@/lib/pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { usePageParam } from '@/hooks/usePageParam';
import toast from 'react-hot-toast';

type ReviewStatus = 'pending' | 'approved' | 'flagged' | 'rejected';

interface AdminReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: ReviewStatus;
  helpful_count: number;
  is_verified_purchase: boolean;
  created_at: string;
  product: string;
  product_slug?: string;
  user_name: string;
  user_email?: string;
}

/**
 * Moderation counters for every review, computed server-side. Deriving them
 * from `reviews` would count only the rows on the current page while the cards
 * are labelled as totals.
 */
interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  flagged: number;
  rejected: number;
}

const EMPTY_STATS: ReviewStats = {
  total: 0,
  pending: 0,
  approved: 0,
  flagged: 0,
  rejected: 0,
};

const getStatusBadge = (status: ReviewStatus) => {
  const map: Record<ReviewStatus, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
    pending: { variant: 'warning', label: 'Pending' },
    approved: { variant: 'success', label: 'Approved' },
    flagged: { variant: 'danger', label: 'Flagged' },
    rejected: { variant: 'danger', label: 'Rejected' },
  };
  return (
    <Badge variant={map[status].variant} size="sm">
      {map[status].label}
    </Badge>
  );
};

export default function AdminReviewsPage() {
  // `usePageParam` reads `useSearchParams`, which must sit behind Suspense.
  return (
    <Suspense>
      <AdminReviewsContent />
    </Suspense>
  );
}

function AdminReviewsContent() {
  // The box is controlled; the committed term is debounced, otherwise every
  // keystroke is a request and the table flickers through empty result sets.
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400).trim();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [stats, setStats] = useState<ReviewStats>(EMPTY_STATS);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);

  const { page: currentPage, setPage: setCurrentPage } = usePageParam({
    resetOn: [search, statusFilter],
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(ITEMS_PER_PAGE),
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/v1/admin/reviews?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setReviews(json.data || []);
        setStats(json.stats || EMPTY_STATS);
        const pages = json.meta?.totalPages || 1;
        setTotalPages(pages);
        setTotalItems(json.meta?.totalItems || 0);
        // Moderating a review can remove it from the active status tab, which
        // can leave the current page past the end of the result set.
        if (currentPage > pages) {
          setCurrentPage(pages);
        }
      } else {
        const msg = json.error || 'Failed to load reviews';
        setError(msg);
        toast.error(msg);
      }
    } catch {
      const msg = 'Network error. Please check your connection.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, currentPage, setCurrentPage]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (
    id: string,
    action: 'approve' | 'flag' | 'reject' | 'delete'
  ) => {
    setActing(id);
    try {
      if (action === 'delete') {
        const res = await fetch(`/api/v1/admin/reviews/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (json.success) toast.success('Review deleted');
        else toast.error(json.error || 'Failed to delete review');
      } else {
        const status =
          action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged';
        const res = await fetch(`/api/v1/admin/reviews/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        const json = await res.json();
        if (json.success)
          toast.success(
            action === 'approve'
              ? 'Review approved'
              : action === 'reject'
                ? 'Review rejected'
                : 'Review flagged'
          );
        else toast.error(json.error || 'Update failed');
      }
      await load();
    } catch {
      toast.error('Action failed');
    } finally {
      setActing(null);
    }
  };

  const flaggedCount = stats.flagged;

  const getInitials = (name: string) =>
    name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">Reviews Moderation</h1>
        <p className="text-sm text-muted-500">Review and moderate customer feedback</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{stats.total}</p>
              <p className="text-xs text-muted-500">Total Visible</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{stats.pending}</p>
              <p className="text-xs text-muted-500">Pending Approval</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-100 text-danger-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{flaggedCount}</p>
              <p className="text-xs text-muted-500">Flagged</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 text-success-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{stats.approved}</p>
              <p className="text-xs text-muted-500">Approved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Reviews Alert */}
      {flaggedCount > 0 && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <div>
              <p className="font-medium text-secondary-800">{flaggedCount} flagged reviews need attention</p>
              <p className="text-sm text-muted-600">Reviews flagged by users or for policy violations</p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
            <input
              type="search"
              placeholder="Search reviews..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search reviews"
              className="w-full rounded-lg border border-muted-200 bg-white py-2 pl-10 pr-4 text-base sm:text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-700 focus:border-primary focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="flagged">Flagged</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-danger" />
            <p className="font-medium text-secondary-800">Failed to load reviews</p>
            <p className="mt-1 text-sm text-muted-500">{error}</p>
            <button
              onClick={load}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
            >
              Try Again
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-16 text-center text-muted-500">No reviews found</div>
        ) : (
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className={cn(
                  'rounded-lg border p-4',
                  review.status === 'flagged'
                    ? 'border-danger-200 bg-danger-50/30'
                    : 'border-muted-100 bg-white'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                      {getInitials(review.user_name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-secondary-800">{review.user_name}</p>
                        {review.is_verified_purchase && (
                          <Badge variant="primary" size="sm">Verified</Badge>
                        )}
                        {getStatusBadge(review.status)}
                      </div>
                      <p className="text-xs text-muted-500">
                        on <span className="font-medium text-secondary-700">{review.product}</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-400">
                    {new Date(review.created_at).toLocaleDateString('en-PK')}
                  </p>
                </div>

                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < review.rating
                          ? 'fill-warning text-warning'
                          : 'text-muted-200'
                      )}
                    />
                  ))}
                </div>

                {review.title && (
                  <p className="mt-2 text-sm font-semibold text-secondary-800">{review.title}</p>
                )}
                <p className="mt-1 text-sm text-secondary-700">{review.comment}</p>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-400">
                    <ThumbsUp className="h-3 w-3" />
                    {review.helpful_count} found this helpful
                  </div>
                  <div className="flex items-center gap-1">
                    {review.status !== 'approved' && (
                      <button
                        onClick={() => act(review.id, 'approve')}
                        disabled={acting === review.id}
                        className="rounded px-2.5 py-1 text-xs font-medium text-success transition-colors hover:bg-success-50 disabled:opacity-50"
                      >
                        <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                        Approve
                      </button>
                    )}
                    {review.status !== 'flagged' && (
                      <button
                        onClick={() => act(review.id, 'flag')}
                        disabled={acting === review.id}
                        className="rounded px-2.5 py-1 text-xs font-medium text-warning-700 transition-colors hover:bg-warning-50 disabled:opacity-50"
                      >
                        <Flag className="mr-1 inline h-3.5 w-3.5" />
                        Flag
                      </button>
                    )}
                    {review.status !== 'rejected' && (
                      <button
                        onClick={() => act(review.id, 'reject')}
                        disabled={acting === review.id}
                        className="rounded px-2.5 py-1 text-xs font-medium text-secondary-700 transition-colors hover:bg-muted-100 disabled:opacity-50"
                      >
                        <Ban className="mr-1 inline h-3.5 w-3.5" />
                        Reject
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(review)}
                      disabled={acting === review.id}
                      className="rounded px-2.5 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger-50 disabled:opacity-50"
                    >
                      {acting === review.id ? (
                        <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          variant="table"
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
          itemLabel="reviews"
          className="mt-4"
        />
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            act(deleteTarget.id, 'delete').finally(() => setDeleteTarget(null));
          } else {
            setDeleteTarget(null);
          }
        }}
        title="Delete review?"
        message={
          deleteTarget
            ? `This will permanently remove the review by ${deleteTarget.user_name}. This action cannot be undone.`
            : ''
        }
        variant="danger"
        confirmLabel="Delete review"
        loading={deleteTarget !== null && acting === deleteTarget.id}
      />
    </div>
  );
}
