'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Banknote,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import { PAGE_SIZE as ITEMS_PER_PAGE } from '@/lib/pagination';
import { usePageParam } from '@/hooks/usePageParam';

type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface AdminPayout {
  id: string;
  seller_id: string;
  seller_name: string;
  seller_email?: string | null;
  amount: number;
  method: string;
  account_details?: Record<string, unknown> | null;
  status: PayoutStatus;
  notes?: string | null;
  processed_at?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

interface AdminPayoutSummary {
  total_requested: number;
  total_paid: number;
  pending_balance: number;
}

// The endpoint builds this with `buildPaginationMeta`, which is camelCase. It
// used to be hand-declared as snake_case here, so every field read as
// `undefined`, `totalPages` stayed 1 and the paginator never rendered — rows
// past the first page were unreachable.
interface AdminPayoutMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface AdminPayoutsResponse {
  success: boolean;
  error?: string;
  data: AdminPayout[];
  summary: AdminPayoutSummary;
  meta: AdminPayoutMeta;
}

const VALID_STATUSES: PayoutStatus[] = ['pending', 'processing', 'completed', 'failed'];

const statusStyles: Record<PayoutStatus, string> = {
  pending: 'bg-muted-100 text-muted-700',
  processing: 'bg-primary-50 text-primary-700',
  completed: 'bg-success-50 text-success-700',
  failed: 'bg-danger-50 text-danger-700',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusIcon(status: PayoutStatus) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="size-3.5" />;
    case 'failed':
      return <XCircle className="size-3.5" />;
    case 'processing':
      return <Clock className="size-3.5" />;
    default:
      return <Clock className="size-3.5" />;
  }
}

function SkeletonBlock({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted-200 ${className}`} />;
}

export default function AdminPayoutsPage() {
  return (
    <Suspense>
      <AdminPayoutsContent />
    </Suspense>
  );
}

function AdminPayoutsContent() {
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [summary, setSummary] = useState<AdminPayoutSummary | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { page: currentPage, setPage: setCurrentPage } = usePageParam({
    resetOn: [statusFilter],
  });

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(currentPage),
        limit: String(ITEMS_PER_PAGE),
      });
      if (statusFilter) query.set('status', statusFilter);

      const res = await fetch(`/api/v1/admin/payouts?${query.toString()}`);
      const data: AdminPayoutsResponse = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Failed to load payouts');
        return;
      }

      setPayouts(data.data || []);
      setSummary(data.summary || null);
      const pages = data.meta?.totalPages || 1;
      setTotalPages(pages);
      setTotalItems(data.meta?.totalItems || 0);
      // Marking a payout as completed or failed can drop it out of the status
      // tab being viewed, which can leave the current page past the end.
      if (currentPage > pages) {
        setCurrentPage(pages);
      }
    } catch {
      toast.error('Failed to load payouts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, setCurrentPage]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const updateStatus = async (payoutId: string, status: PayoutStatus) => {
    setUpdatingId(payoutId);
    try {
      const res = await fetch(`/api/v1/admin/payouts/${payoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Failed to update payout');
        return;
      }

      toast.success('Payout status updated');
      fetchPayouts();
    } catch {
      toast.error('Failed to update payout. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary-800">Payouts</h2>
          <p className="text-sm text-muted-500">Review and process seller payout requests</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-muted-500">Total Requested</p>
          <p className="mt-1 text-2xl font-bold text-secondary-800">
            {formatCurrency(summary?.total_requested ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-400">All payout requests</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-muted-500">Total Paid Out</p>
          <p className="mt-1 text-2xl font-bold text-success">
            {formatCurrency(summary?.total_paid ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-400">Completed payouts</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-muted-500">Pending Balance</p>
          <p className="mt-1 text-2xl font-bold text-warning">
            {formatCurrency(summary?.pending_balance ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-400">Pending + processing</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={!statusFilter ? 'primary' : 'outline'}
          onClick={() => {
            setCurrentPage(1);
            setStatusFilter('');
          }}
        >
          All
        </Button>
        {VALID_STATUSES.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'primary' : 'outline'}
            onClick={() => {
              setCurrentPage(1);
              setStatusFilter(s);
            }}
          >
            {s}
          </Button>
        ))}
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100 bg-muted-50">
                <th className="px-6 py-3 font-medium text-muted-600">Seller</th>
                <th className="px-6 py-3 font-medium text-muted-600">Amount</th>
                <th className="px-6 py-3 font-medium text-muted-600">Method</th>
                <th className="px-6 py-3 font-medium text-muted-600">Status</th>
                <th className="px-6 py-3 font-medium text-muted-600">Requested</th>
                <th className="px-6 py-3 font-medium text-muted-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-muted-50">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-3 py-4 sm:px-6">
                          <SkeletonBlock />
                        </td>
                      ))}
                    </tr>
                  ))
                : payouts.length === 0
                  ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <Wallet className="mx-auto mb-3 size-10 text-muted-300" />
                          <p className="text-sm text-muted-500">No payouts found</p>
                          <p className="mt-1 text-xs text-muted-400">
                            {statusFilter
                              ? `No ${statusFilter} payouts`
                              : 'Seller payout requests will appear here'}
                          </p>
                        </td>
                      </tr>
                    )
                    : payouts.map((payout) => (
                        <tr key={payout.id} className="border-b border-muted-50 hover:bg-muted-25">
                          <td className="px-3 py-4 sm:px-6">
                            <p className="font-medium text-secondary-800">{payout.seller_name}</p>
                            {payout.seller_email && (
                              <p className="text-xs text-muted-400">{payout.seller_email}</p>
                            )}
                          </td>
                          <td className="px-3 py-4 sm:px-6 font-semibold text-secondary-800">
                            {formatCurrency(payout.amount)}
                          </td>
                          <td className="px-3 py-4 sm:px-6">
                            <span className="flex items-center gap-1.5 text-muted-600">
                              <Banknote className="size-4" />
                              {payout.method}
                            </span>
                          </td>
                          <td className="px-3 py-4 sm:px-6">
                            <Badge className={statusStyles[payout.status]}>
                              <span className="flex items-center gap-1">
                                {statusIcon(payout.status)}
                                {payout.status}
                              </span>
                            </Badge>
                          </td>
                          <td className="px-3 py-4 sm:px-6 text-muted-500">
                            {formatDate(payout.created_at)}
                          </td>
                          <td className="px-3 py-4 sm:px-6">
                            <div className="flex flex-wrap gap-2">
                              {payout.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateStatus(payout.id, 'processing')}
                                    disabled={updatingId === payout.id}
                                  >
                                    <Clock className="size-4" />
                                    Process
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStatus(payout.id, 'failed')}
                                    disabled={updatingId === payout.id}
                                  >
                                    <XCircle className="size-4" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {payout.status === 'processing' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateStatus(payout.id, 'completed')}
                                    disabled={updatingId === payout.id}
                                  >
                                    <CheckCircle className="size-4" />
                                    Complete
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStatus(payout.id, 'failed')}
                                    disabled={updatingId === payout.id}
                                  >
                                    <XCircle className="size-4" />
                                    Fail
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-muted-100 px-3 py-4 sm:px-6">
            <Pagination
              variant="simple"
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={ITEMS_PER_PAGE}
              itemLabel="payouts"
              className="mt-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
