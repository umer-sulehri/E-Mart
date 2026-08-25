'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { DollarSign, Clock, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';

function SkeletonBlock({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted-200 ${className}`} />;
}

function StatSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
      <div className="h-12 w-12 animate-pulse rounded-xl bg-muted-200" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-6 w-28" />
      </div>
    </div>
  );
}

export default function SellerEarningsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalOrders: 0,
    totalProductsSold: 0,
    activeProducts: 0,
    totalProducts: 0,
    commissionRate: 0,
    netEarnings: 0,
  });

  useEffect(() => {
    async function fetchEarnings() {
      try {
        const res = await fetch('/api/v1/seller/earnings');
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        } else {
          toast.error(data.error || 'Failed to load earnings');
        }
      } catch {
        toast.error('Failed to load earnings');
      } finally {
        setLoading(false);
      }
    }
    fetchEarnings();
  }, []);

  const commissionPaid = stats.totalRevenue - stats.netEarnings;

  const earningsStats = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, bg: 'bg-primary' },
    { label: 'Net Earnings', value: formatPrice(stats.netEarnings), icon: TrendingUp, bg: 'bg-success' },
    { label: 'Commission Paid', value: formatPrice(commissionPaid), icon: Clock, bg: 'bg-danger' },
    { label: 'This Month', value: formatPrice(stats.monthlyRevenue), icon: Calendar, bg: 'bg-warning' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-secondary-800">Earnings</h2>
        <p className="text-sm text-muted-500">Track your revenue, payouts, and financial history</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : earningsStats.map((stat) => (
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
        <div className="xl:col-span-2 rounded-xl bg-white shadow-sm">
          <div className="border-b border-muted-100 p-6">
            <h3 className="text-lg font-bold text-secondary-800">Earnings Summary</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonBlock key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-lg border border-muted-200 p-4">
                  <p className="text-sm text-muted-500">Total Products Sold</p>
                  <p className="mt-1 text-2xl font-bold text-secondary-800">{stats.totalProductsSold}</p>
                </div>
                <div className="rounded-lg border border-muted-200 p-4">
                  <p className="text-sm text-muted-500">Commission Rate</p>
                  <p className="mt-1 text-2xl font-bold text-secondary-800">{stats.commissionRate}%</p>
                </div>
                <div className="rounded-lg border border-muted-200 p-4">
                  <p className="text-sm text-muted-500">Total Orders</p>
                  <p className="mt-1 text-2xl font-bold text-secondary-800">{stats.totalOrders}</p>
                </div>
                <div className="rounded-lg border border-muted-200 p-4">
                  <p className="text-sm text-muted-500">Active Products</p>
                  <p className="mt-1 text-2xl font-bold text-secondary-800">{stats.activeProducts} / {stats.totalProducts}</p>
                </div>
              </div>
            )}
          </div>
        </div>

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
          </div>
          <Button variant="outline" className="mt-4 w-full">
            Update Payout Method
          </Button>
        </div>
      </div>
    </div>
  );
}
