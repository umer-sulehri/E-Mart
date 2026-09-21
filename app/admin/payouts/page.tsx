'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Banknote,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

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

interface AdminPayoutMeta {
  current_page: number;
  total_pages: number;
  total_items: number;
  has_next_page?: boolean;
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
      return <CheckCircle className="h-3.5 w-3.5" />;
    case 'failed':
      return <XCircle className="h-3.5 w-3.5" />;
    case 'processing':
      return <Clock className="h-3.5 w-3.5" />;
    default:
      return <Clock className="h-3.5 w-3.5" />;
  }
}

function SkeletonBlock({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted-200 ${className}`} />;
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [summary, setSummary] = useState<AdminPayoutSummary | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
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
      setTotalPages(data.meta?.total_pages || 1);
      setTotalItems(data.meta?.total_items || 0);
    } catch {
      toast.error('Failed to load payouts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

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
                        <td key={j} className="px-6 py-4">
                          <SkeletonBlock />
                        </td>
                      ))}
                    </tr>
                  ))
                : payouts.length === 0
                  ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <Wallet className="mx-auto mb-3 h-10 w-10 text-muted-300" />
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
                          <td className="px-6 py-4">
                            <p className="font-medium text-secondary-800">{payout.seller_name}</p>
                            {payout.seller_email && (
                              <p className="text-xs text-muted-400">{payout.seller_email}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 font-semibold text-secondary-800">
                            {formatCurrency(payout.amount)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1.5 text-muted-600">
                              <Banknote className="h-4 w-4" />
                              {payout.method}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={statusStyles[payout.status]}>
                              <span className="flex items-center gap-1">
                                {statusIcon(payout.status)}
                                {payout.status}
                              </span>
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-muted-500">
                            {formatDate(payout.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {payout.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateStatus(payout.id, 'processing')}
                                    disabled={updatingId === payout.id}
                                  >
                                    <Clock className="h-4 w-4" />
                                    Process
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStatus(payout.id, 'failed')}
                                    disabled={updatingId === payout.id}
                                  >
                                    <XCircle className="h-4 w-4" />
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
                                    <CheckCircle className="h-4 w-4" />
                                    Complete
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStatus(payout.id, 'failed')}
                                    disabled={updatingId === payout.id}
                                  >
                                    <XCircle className="h-4 w-4" />
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
          <div className="flex items-center justify-between border-t border-muted-100 px-6 py-4">
            <p className="text-xs text-muted-500">
              {totalItems} total · page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
