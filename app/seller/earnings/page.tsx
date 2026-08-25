'use client';

import { useState } from 'react';
import { DollarSign, Clock, TrendingUp, Calendar, CreditCard, ChevronRight } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const earningsStats = [
  { label: 'Total Earnings', value: formatPrice(125400), icon: DollarSign, bg: 'bg-primary' },
  { label: 'Pending Payouts', value: formatPrice(12800), icon: Clock, bg: 'bg-warning' },
  { label: 'Commission Paid', value: formatPrice(12540), icon: TrendingUp, bg: 'bg-danger' },
  { label: 'This Month', value: formatPrice(34200), icon: Calendar, bg: 'bg-success' },
];

const monthlyBreakdown = [
  { period: 'August 2026', orders: 12, gross: 38000, commission: 3800, net: 34200 },
  { period: 'July 2026', orders: 10, gross: 32500, commission: 3250, net: 29250 },
  { period: 'June 2026', orders: 8, gross: 28000, commission: 2800, net: 25200 },
  { period: 'May 2026', orders: 7, gross: 22000, commission: 2200, net: 19800 },
  { period: 'April 2026', orders: 5, gross: 15000, commission: 1500, net: 13500 },
  { period: 'March 2026', orders: 3, gross: 8900, commission: 890, net: 8010 },
];

const transactions = [
  { id: 'TXN-001', date: '2026-08-20', type: 'Sale', order: 'EM-2026-10482', amount: 4850, fee: 485, net: 4365, status: 'completed' },
  { id: 'TXN-002', date: '2026-08-18', type: 'Sale', order: 'EM-2026-10471', amount: 8920, fee: 892, net: 8028, status: 'completed' },
  { id: 'TXN-003', date: '2026-08-15', type: 'Sale', order: 'EM-2026-10459', amount: 3200, fee: 320, net: 2880, status: 'completed' },
  { id: 'TXN-004', date: '2026-08-12', type: 'Payout', order: '-', amount: 0, fee: 0, net: -42000, status: 'completed' },
  { id: 'TXN-005', date: '2026-08-10', type: 'Sale', order: 'EM-2026-10415', amount: 1950, fee: 195, net: 1755, status: 'completed' },
  { id: 'TXN-006', date: '2026-08-08', type: 'Refund', order: 'EM-2026-10400', amount: -1199, fee: 0, net: 1199, status: 'refunded' },
];

export default function SellerEarningsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-secondary-800">Earnings</h2>
        <p className="text-sm text-muted-500">Track your revenue, payouts, and financial history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {earningsStats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} text-white`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-500">{stat.label}</p>
              <p className="text-xl font-bold text-secondary-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Monthly Breakdown */}
        <div className="xl:col-span-2 rounded-xl bg-white shadow-sm">
          <div className="border-b border-muted-100 p-6">
            <h3 className="text-lg font-bold text-secondary-800">Monthly Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-muted-100 bg-muted-50">
                  <th className="px-6 py-3 font-medium text-muted-600">Period</th>
                  <th className="px-6 py-3 font-medium text-muted-600">Orders</th>
                  <th className="px-6 py-3 font-medium text-muted-600 text-right">Gross</th>
                  <th className="px-6 py-3 font-medium text-muted-600 text-right">Commission</th>
                  <th className="px-6 py-3 font-medium text-muted-600 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((row) => (
                  <tr key={row.period} className="border-b border-muted-50 transition-colors hover:bg-muted-50/50">
                    <td className="px-6 py-4 font-medium text-secondary-800">{row.period}</td>
                    <td className="px-6 py-4 text-muted-600">{row.orders}</td>
                    <td className="px-6 py-4 text-right text-secondary-800">{formatPrice(row.gross)}</td>
                    <td className="px-6 py-4 text-right text-danger">-{formatPrice(row.commission)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-success">{formatPrice(row.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payout Method */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-secondary-800">Payout Method</h3>
          <div className="rounded-lg border border-muted-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-secondary-800">Bank Account</p>
                <p className="text-xs text-muted-500">HBL - ****4589</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-500">Account Holder</span>
                <span className="font-medium text-secondary-800">Ahmed Khan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-500">IBAN</span>
                <span className="font-medium text-secondary-800">PK36SCBL0000001234567890</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-500">Payout Schedule</span>
                <span className="font-medium text-secondary-800">Bi-weekly</span>
              </div>
            </div>
          </div>
          <Button variant="outline" className="mt-4 w-full">
            Update Payout Method
          </Button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b border-muted-100 p-6">
          <h3 className="text-lg font-bold text-secondary-800">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100 bg-muted-50">
                <th className="px-6 py-3 font-medium text-muted-600">Transaction ID</th>
                <th className="px-6 py-3 font-medium text-muted-600">Date</th>
                <th className="px-6 py-3 font-medium text-muted-600">Type</th>
                <th className="px-6 py-3 font-medium text-muted-600">Order</th>
                <th className="px-6 py-3 font-medium text-muted-600 text-right">Amount</th>
                <th className="px-6 py-3 font-medium text-muted-600 text-right">Fee</th>
                <th className="px-6 py-3 font-medium text-muted-600 text-right">Net</th>
                <th className="px-6 py-3 font-medium text-muted-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id} className="border-b border-muted-50 transition-colors hover:bg-muted-50/50">
                  <td className="px-6 py-4 font-medium text-secondary-800">{txn.id}</td>
                  <td className="px-6 py-4 text-muted-600">{formatDate(txn.date)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={txn.type === 'Sale' ? 'success' : txn.type === 'Payout' ? 'primary' : 'danger'}>
                      {txn.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-600">{txn.order}</td>
                  <td className="px-6 py-4 text-right text-secondary-800">{formatPrice(txn.amount)}</td>
                  <td className="px-6 py-4 text-right text-danger">
                    {txn.fee > 0 ? `-${formatPrice(txn.fee)}` : '-'}
                  </td>
                  <td className={`px-6 py-4 text-right font-semibold ${txn.net >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatPrice(txn.net)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={txn.status === 'completed' ? 'success' : 'danger'}>
                      {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                    </Badge>
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
