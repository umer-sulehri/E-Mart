'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import {
  useSellerEarnings,
  useSellerPayouts,
} from '@/hooks/useSeller';
import {
  ChartBarIcon, OrderIcon, ArrowRightIcon, CheckCircleIcon, WalletIcon,
} from '@/components/icons';

const PAYOUT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank Transfer',
  stripe_connect: 'Stripe Connect',
  jazzcash: 'JazzCash',
};

const PAYOUT_STATUS_STYLES: Record<string, { background: string; color: string }> = {
  paid: { background: 'rgba(110,139,94,0.15)', color: '#6E8B5E' },
  processing: { background: 'rgba(201,144,46,0.15)', color: '#C9902E' },
  requested: { background: 'rgba(201,144,46,0.15)', color: '#C9902E' },
  rejected: { background: 'rgba(182,92,75,0.15)', color: '#B65C4B' },
};

function formatMonth(monthKey: string): string {
  const [y, mm] = monthKey.split('-');
  const label = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(mm) - 1];
  return mm === '01' ? `Jan '${y.slice(2)}` : label;
}

export default function SellerEarningsPage() {
  const user = useAuthStore((s) => s.user);
  const { data: earningsData, isLoading } = useSellerEarnings();
  const { data: payoutData, refetch } = useSellerPayouts();

  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'bank_transfer' | 'stripe_connect' | 'jazzcash'>('bank_transfer');
  const [payoutMessage, setPayoutMessage] = useState('');
  const [payoutError, setPayoutError] = useState('');
  const [requesting, setRequesting] = useState(false);

  const monthly = earningsData?.monthly ?? [];
  const maxAmount = Math.max(...monthly.map((m) => m.amount), 1);
  const thisMonth = monthly.length > 0 ? monthly[monthly.length - 1].amount : 0;
  const summary = payoutData?.summary;
  const payouts = payoutData?.payouts ?? [];

  const handleRequestPayout = async () => {
    setPayoutError('');
    setPayoutMessage('');
    const amount = Number(payoutAmount);
    if (!(amount > 0)) {
      setPayoutError('Enter a payout amount greater than zero.');
      return;
    }
    if (summary && amount > summary.availableForPayout) {
      setPayoutError(`Amount exceeds your available balance (Rs ${summary.availableForPayout.toLocaleString()}).`);
      return;
    }
    setRequesting(true);
    try {
      const res = await fetch('/api/v1/seller/payout/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method: payoutMethod }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Payout request failed.');
      }
      setPayoutMessage(`Payout of Rs ${amount.toLocaleString()} requested successfully.`);
      setPayoutAmount('');
      void refetch();
    } catch (e) {
      setPayoutError(e instanceof Error ? e.message : 'Payout request failed.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-[16px] p-6" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 10px 25px rgba(122,155,118,0.3)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Earnings</h1>
            <p className="text-white/70">Track your revenue and payouts, {user?.name || 'Seller'}.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
            <ChartBarIcon className="w-4 h-4" /> Revenue Overview
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ArrowRightIcon, label: 'Gross Earnings', value: `Rs ${(earningsData?.totalEarnings ?? 0).toLocaleString()}`, color: 'var(--color-primary)' },
          { icon: ChartBarIcon, label: 'This Month', value: `Rs ${thisMonth.toLocaleString()}`, color: '#C97B5A' },
          { icon: OrderIcon, label: 'Net (after 10% fee)', value: summary ? `Rs ${summary.netEarnings.toLocaleString()}` : '—', color: '#C9902E' },
          { icon: CheckCircleIcon, label: 'Available for Payout', value: summary ? `Rs ${summary.availableForPayout.toLocaleString()}` : '—', color: '#6E8B5E' },
        ].map(stat => (
          <div key={stat.label} className="rounded-[14px] p-5 transition-all duration-300 hover:-translate-y-1" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{isLoading ? '…' : stat.value}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Earnings Chart */}
      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Monthly Earnings (last 12 months)</h3>
        {monthly.length === 0 ? (
          <p className="py-10 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No sales data yet. Your monthly earnings will chart here once orders come in.
          </p>
        ) : (
          <div className="flex items-end gap-1.5 h-48">
            {monthly.map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap shadow-lg" style={{ background: 'var(--color-text-primary)', color: 'var(--color-text-inverse)' }}>
                  Rs {item.amount.toLocaleString()}
                </div>
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max((item.amount / maxAmount) * 100, item.amount > 0 ? 4 : 1)}%`,
                    background: `linear-gradient(180deg, var(--color-primary), var(--color-primary-dark))`,
                  }}
                />
                <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{formatMonth(item.month)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Payout */}
      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Request a Payout</h3>
        {summary && (
          <p className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Available balance: <strong style={{ color: 'var(--color-text-primary)' }}>Rs {summary.availableForPayout.toLocaleString()}</strong> · Minimum payout Rs 5,000 · Commission withheld: Rs {summary.commission.toLocaleString()}
          </p>
        )}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Amount (Rs)</label>
            <input
              type="number"
              min="0"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              placeholder="e.g. 10000"
              className="px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 w-40"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              aria-label="Payout amount"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Method</label>
            <select
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value as typeof payoutMethod)}
              className="px-4 py-3 rounded-xl text-sm focus:outline-none"
              style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              aria-label="Payout method"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="jazzcash">JazzCash</option>
              <option value="stripe_connect">Stripe Connect</option>
            </select>
          </div>
          <button
            onClick={handleRequestPayout}
            disabled={requesting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
          >
            <WalletIcon className="w-4 h-4" /> {requesting ? 'Requesting…' : 'Request Payout'}
          </button>
        </div>
        {payoutMessage && (
          <p className="mt-3 text-sm font-medium px-4 py-2 rounded-xl inline-block" style={{ background: 'rgba(110,139,94,0.15)', color: '#6E8B5E' }}>{payoutMessage}</p>
        )}
        {payoutError && (
          <p className="mt-3 text-sm font-medium px-4 py-2 rounded-xl inline-block" style={{ background: 'rgba(182,92,75,0.12)', color: 'var(--color-error)' }}>{payoutError}</p>
        )}
      </div>

      {/* Top Earning Products */}
      {(earningsData?.products?.length ?? 0) > 0 && (
        <div className="rounded-[16px] overflow-hidden" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <div className="p-5" style={{ borderBottom: '2px solid var(--color-primary)' }}>
            <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Top Earning Products</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Product', 'Units Sold', 'Earnings'].map(h => (
                    <th key={h} className="text-left p-4 font-semibold text-sm" style={{ background: 'var(--color-primary-dark)', color: 'var(--color-primary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...earningsData!.products].sort((a, b) => b.earnings - a.earnings).map(product => (
                  <tr key={product.name} className="transition-colors hover:bg-white/50" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="p-4 font-medium" style={{ color: 'var(--color-text-primary)' }}>{product.name}</td>
                    <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>{product.quantity}</td>
                    <td className="p-4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>Rs {product.earnings.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payout History */}
      <div className="rounded-[16px] overflow-hidden" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <div className="p-5" style={{ borderBottom: '2px solid var(--color-primary)' }}>
          <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Payout History</h3>
        </div>
        {payouts.length === 0 ? (
          <p className="p-10 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No payouts yet. Requests you submit will appear here with their status.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Date', 'Amount', 'Status', 'Method'].map(h => (
                    <th key={h} className="text-left p-4 font-semibold text-sm" style={{ background: 'var(--color-primary-dark)', color: 'var(--color-primary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map(payout => (
                  <tr key={payout.id} className="transition-colors hover:bg-white/50" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="p-4 whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(payout.requestedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 font-semibold whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
                      Rs {payout.amount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize"
                        style={PAYOUT_STATUS_STYLES[payout.status] ?? PAYOUT_STATUS_STYLES.requested}
                      >
                        {payout.status}
                      </span>
                    </td>
                    <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>
                      {PAYOUT_METHOD_LABELS[payout.method] ?? payout.method}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
