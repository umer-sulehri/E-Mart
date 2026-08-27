'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Wallet, Clock, CheckCircle, XCircle, CreditCard, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatPrice, formatDate } from '@/lib/utils';

interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  account_details: Record<string, string>;
  requested_at: string;
  processed_at: string | null;
}

function SkeletonBlock({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted-200 ${className}`} />;
}

export default function SellerPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/seller/payout');
      const data = await res.json();
      if (data.success) {
        setPayouts(data.data || []);
      } else {
        toast.error(data.error || 'Failed to load payouts');
      }
    } catch {
      toast.error('Failed to load payouts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleRequest = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setRequesting(true);
    try {
      const res = await fetch('/api/v1/seller/payout/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Payout request submitted');
        setAmount('');
        setRequestOpen(false);
        fetchPayouts();
      } else {
        toast.error(data.error || 'Failed to request payout');
      }
    } catch {
      toast.error('Failed to request payout');
    } finally {
      setRequesting(false);
    }
  };

  const statusVariant: Record<string, 'success' | 'warning' | 'primary' | 'danger' | 'default'> = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    failed: 'danger',
  };

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="h-4 w-4" />;
    if (status === 'failed') return <XCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary-800">Payouts</h2>
          <p className="text-sm text-muted-500">Request and track your earnings payouts</p>
        </div>
        <Button size="sm" onClick={() => setRequestOpen(true)}>
          <Plus className="h-4 w-4" />
          Request Payout
        </Button>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100 bg-muted-50">
                <th className="px-6 py-3 font-medium text-muted-600">Amount</th>
                <th className="px-6 py-3 font-medium text-muted-600">Status</th>
                <th className="px-6 py-3 font-medium text-muted-600">Method</th>
                <th className="px-6 py-3 font-medium text-muted-600">Requested</th>
                <th className="px-6 py-3 font-medium text-muted-600">Processed</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-muted-50">
                      <td className="px-6 py-4"><SkeletonBlock className="h-5 w-24" /></td>
                      <td className="px-6 py-4"><SkeletonBlock className="h-5 w-20" /></td>
                      <td className="px-6 py-4"><SkeletonBlock className="h-5 w-24" /></td>
                      <td className="px-6 py-4"><SkeletonBlock className="h-5 w-28" /></td>
                      <td className="px-6 py-4"><SkeletonBlock className="h-5 w-28" /></td>
                    </tr>
                  ))
                : payouts.length === 0
                  ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <Wallet className="mx-auto mb-3 h-10 w-10 text-muted-300" />
                          <p className="text-sm text-muted-500">No payouts yet</p>
                          <p className="mt-1 text-xs text-muted-400">Request your first payout to start</p>
                        </td>
                      </tr>
                    )
                  : payouts.map((payout) => (
                      <tr key={payout.id} className="border-b border-muted-50 transition-colors hover:bg-muted-50/50">
                        <td className="px-6 py-4 font-semibold text-secondary-800">
                          {formatPrice(payout.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={statusVariant[payout.status] ?? 'default'}>
                            <span className="flex items-center gap-1">
                              {statusIcon(payout.status)}
                              {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                            </span>
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-600 capitalize">
                          <span className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-400" />
                            {payout.method || 'Bank'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-600">{formatDate(payout.requested_at)}</td>
                        <td className="px-6 py-4 text-muted-600">
                          {payout.processed_at ? formatDate(payout.processed_at) : '—'}
                        </td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request payout modal */}
      {requestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setRequestOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-bold text-secondary-800">Request Payout</h3>
            <p className="mb-4 text-sm text-muted-500">
              Withdraw your available earnings to your bank account.
            </p>
            <label className="mb-1 block text-sm font-medium text-secondary-700">Amount (PKR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min={100}
              className="w-full rounded-lg border border-muted-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setRequestOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleRequest} loading={requesting}>
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
