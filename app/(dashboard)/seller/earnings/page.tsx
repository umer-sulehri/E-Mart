'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { ChartBarIcon, OrderIcon, ArrowRightIcon, CheckCircleIcon } from '@/components/icons';

const MONTHLY_EARNINGS = [
  { month: 'Jan', amount: 32000 },
  { month: 'Feb', amount: 41000 },
  { month: 'Mar', amount: 38000 },
  { month: 'Apr', amount: 52000 },
  { month: 'May', amount: 61000 },
  { month: 'Jun', amount: 58000 },
  { month: 'Jul', amount: 72000 },
  { month: 'Aug', amount: 81000 },
  { month: 'Sep', amount: 76000 },
  { month: 'Oct', amount: 92000 },
  { month: 'Nov', amount: 88000 },
  { month: 'Dec', amount: 105000 },
];

const PAYOUT_HISTORY = [
  { id: 'p1', date: '2025-02-15', amount: 45000, status: 'paid', method: 'Bank Transfer' },
  { id: 'p2', date: '2025-01-15', amount: 38000, status: 'paid', method: 'Bank Transfer' },
  { id: 'p3', date: '2024-12-15', amount: 32000, status: 'paid', method: 'JazzCash' },
  { id: 'p4', date: '2024-11-15', amount: 28000, status: 'paid', method: 'Bank Transfer' },
  { id: 'p5', date: '2025-03-15', amount: 52000, status: 'pending', method: 'Bank Transfer' },
];

export default function SellerEarningsPage() {
  const user = useAuthStore((s) => s.user);

  const stats = useMemo(() => {
    const totalEarnings = MONTHLY_EARNINGS.reduce((s, m) => s + m.amount, 0);
    const thisMonth = MONTHLY_EARNINGS[MONTHLY_EARNINGS.length - 1].amount;
    const pendingPayout = PAYOUT_HISTORY.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
    return { totalEarnings, thisMonth, pendingPayout, ordersCompleted: 24 };
  }, []);

  const maxAmount = Math.max(...MONTHLY_EARNINGS.map(m => m.amount));

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
          { icon: ArrowRightIcon, label: 'Total Earnings', value: `Rs ${stats.totalEarnings.toLocaleString()}`, color: 'var(--color-primary)' },
          { icon: ChartBarIcon, label: 'This Month', value: `Rs ${stats.thisMonth.toLocaleString()}`, color: '#C97B5A' },
          { icon: OrderIcon, label: 'Pending Payouts', value: `Rs ${stats.pendingPayout.toLocaleString()}`, color: '#C9902E' },
          { icon: CheckCircleIcon, label: 'Orders Completed', value: stats.ordersCompleted, color: '#6E8B5E' },
        ].map(stat => (
          <div key={stat.label} className="rounded-[14px] p-5 transition-all duration-300 hover:-translate-y-1" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{stat.value}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Earnings Chart */}
      <div className="rounded-[16px] p-6" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <h3 className="font-bold mb-4 pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '2px solid var(--color-primary)' }}>Monthly Earnings</h3>
        <div className="flex items-end gap-1.5 h-48">
          {MONTHLY_EARNINGS.map((item) => (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap shadow-lg" style={{ background: 'var(--color-text-primary)', color: 'var(--color-text-inverse)' }}>
                Rs {item.amount.toLocaleString()}
              </div>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${(item.amount / maxAmount) * 100}%`,
                  background: `linear-gradient(180deg, var(--color-primary), var(--color-primary-dark))`,
                }}
              />
              <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{item.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payout History */}
      <div className="rounded-[16px] overflow-hidden" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
        <div className="p-5" style={{ borderBottom: '2px solid var(--color-primary)' }}>
          <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Payout History</h3>
        </div>
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
              {PAYOUT_HISTORY.map(payout => (
                <tr key={payout.id} className="transition-colors hover:bg-white/50" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="p-4 whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(payout.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="p-4 font-semibold whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
                    Rs {payout.amount.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: payout.status === 'paid' ? 'rgba(110,139,94,0.15)' : 'rgba(201,144,46,0.15)',
                        color: payout.status === 'paid' ? '#6E8B5E' : '#C9902E',
                      }}
                    >
                      {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4" style={{ color: 'var(--color-text-secondary)' }}>
                    {payout.method}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
