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

interface PayoutSummary {
  total_paid: number;
  pending_balance: number;
  total_payouts: number;
}

const MIN_PAYOUT_AMOUNT = 5000;

function SkeletonBlock({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted-200 ${className}`} />;
}

export default function SellerPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank');
  const [accountDetails, setAccountDetails] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/seller/payout');
      const data = await res.json();
      if (data.success) {
        const payoutArray = Array.isArray(data.data?.payouts)
          ? data.data.payouts
          : Array.isArray(data.data)
            ? data.data
            : [];
        setPayouts(payoutArray);
        if (data.data?.summary) setSummary(data.data.summary);
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

  const availableBalance = summary?.pending_balance ?? 0;

  const handleRequest = async () => {
    const validation: Record<string, string> = {};
    const amt = Number(amount);
    if (!amount.trim() || !amt || amt <= 0) {
      validation.amount = 'Enter a valid amount';
    } else if (amt < MIN_PAYOUT_AMOUNT) {
      validation.amount = `Minimum payout amount is Rs. ${MIN_PAYOUT_AMOUNT.toLocaleString()}`;
    } else if (amt > availableBalance) {
      validation.amount = `Insufficient balance. Available: Rs. ${availableBalance.toLocaleString()}`;
    }
    if (!accountDetails.trim()) {
      validation.accountDetails = 'Enter your account details';
    } else if (method !== 'bank' && !/^(\+92|0)3\d{9}$/.test(accountDetails.trim())) {
      validation.accountDetails = 'Enter a valid mobile number (e.g. 0300-1234567)';
    }
    setFieldErrors(validation);
    if (Object.keys(validation).length > 0) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setRequesting(true);
    try {
      const res = await fetch('/api/v1/seller/payout/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          method,
          account_details: { value: accountDetails.trim() },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Payout request submitted successfully');
        setAmount('');
        setMethod('bank');
        setAccountDetails('');
        setFieldErrors({});
        setRequestOpen(false);
        fetchPayouts();
      } else {
        toast.error(data.error || 'Failed to request payout');
      }
    } catch {
      toast.error('Failed to request payout. Please try again.');
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-muted-500">Available Balance</p>
          <p className="mt-1 text-2xl font-bold text-success">
            {formatPrice(availableBalance)}
          </p>
          <p className="mt-1 text-xs text-muted-400">Earnings available to withdraw</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-muted-500">Total Paid Out</p>
          <p className="mt-1 text-2xl font-bold text-secondary-800">
            {formatPrice(summary?.total_paid ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-400">Lifetime payouts received</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-muted-500">Payouts</p>
          <p className="mt-1 text-2xl font-bold text-secondary-800">
            {summary?.total_payouts ?? payouts.length}
          </p>
          <p className="mt-1 text-xs text-muted-400">Total payout requests</p>
        </div>
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
              onChange={(e) => {
                setAmount(e.target.value);
                setFieldErrors((prev) => ({ ...prev, amount: '' }));
              }}
              placeholder={`Min Rs. ${MIN_PAYOUT_AMOUNT.toLocaleString()}`}
              min={MIN_PAYOUT_AMOUNT}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.amount
                  ? 'border-danger focus:border-danger focus:ring-danger/20'
                  : 'border-muted-200 focus:border-primary focus:ring-primary/20'
              }`}
            />
            {fieldErrors.amount && (
              <p className="mt-1 text-xs text-danger">{fieldErrors.amount}</p>
            )}
            <p className="mt-1 text-xs text-muted-400">
              Minimum withdraw amount is Rs. {MIN_PAYOUT_AMOUNT.toLocaleString()}. Available
              balance: <span className="font-medium text-success">{formatPrice(availableBalance)}</span>.
            </p>
            <label className="mb-1 mt-4 block text-sm font-medium text-secondary-700">Payout Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-lg border border-muted-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="bank">Bank Transfer</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="jazzcash">JazzCash</option>
            </select>
            <label className="mb-1 mt-4 block text-sm font-medium text-secondary-700">
              Account Details
            </label>
            <input
              type="text"
              value={accountDetails}
              onChange={(e) => {
                setAccountDetails(e.target.value);
                setFieldErrors((prev) => ({ ...prev, accountDetails: '' }));
              }}
              placeholder={
                method === 'bank'
                  ? 'Account name / IBAN'
                  : 'Mobile number (03xx-xxxxxxx)'
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                fieldErrors.accountDetails
                  ? 'border-danger focus:border-danger focus:ring-danger/20'
                  : 'border-muted-200 focus:border-primary focus:ring-primary/20'
              }`}
            />
            {fieldErrors.accountDetails && (
              <p className="mt-1 text-xs text-danger">{fieldErrors.accountDetails}</p>
            )}
            <p className="mt-1 text-xs text-muted-400">Enter the account details for receiving the payout.</p>
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
