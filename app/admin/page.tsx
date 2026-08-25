'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

function SkeletonBlock({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted-200 ${className}`} />;
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-muted-200" />
        <div className="h-4 w-12 animate-pulse rounded bg-muted-200" />
      </div>
      <SkeletonBlock className="mt-3 h-7 w-20" />
      <SkeletonBlock className="mt-1 h-3 w-16" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    monthlyRevenue: 0,
    lastMonthRevenue: 0,
    revenueGrowth: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/v1/admin/analytics/dashboard');
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        } else {
          toast.error(data.error || 'Failed to load dashboard');
        }
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, change: `+${stats.revenueGrowth}%`, up: stats.revenueGrowth >= 0, color: 'bg-primary-100 text-primary-600' },
    { label: 'Total Sellers', value: stats.totalSellers.toLocaleString(), icon: Store, change: '', up: true, color: 'bg-success-100 text-success-600' },
    { label: 'Total Products', value: stats.totalProducts.toLocaleString(), icon: Package, change: `${stats.activeProducts} active`, up: true, color: 'bg-warning-100 text-warning-600' },
    { label: 'Total Orders', value: stats.totalOrders.toLocaleString(), icon: ShoppingCart, change: `${stats.pendingOrders} pending`, up: true, color: 'bg-danger-100 text-danger-600' },
    { label: 'Revenue', value: formatPrice(stats.monthlyRevenue), icon: DollarSign, change: `${stats.revenueGrowth}%`, up: stats.revenueGrowth >= 0, color: 'bg-secondary-100 text-secondary-600' },
    { label: 'Delivered', value: stats.deliveredOrders.toLocaleString(), icon: Activity, change: '', up: true, color: 'bg-blue-100 text-blue-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Admin Dashboard</h1>
          <p className="text-sm text-muted-500">Overview of your marketplace</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  {stat.change && (
                    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', stat.up ? 'text-success' : 'text-danger')}>
                      {stat.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-2xl font-bold text-secondary-800">{stat.value}</p>
                <p className="text-xs text-muted-500">{stat.label}</p>
              </div>
            ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-800">Revenue Overview</h2>
          </div>
          <div className="mt-4 flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted-200 bg-muted-50">
            <div className="text-center">
              <DollarSign className="mx-auto h-12 w-12 text-muted-300" />
              <p className="mt-2 text-sm text-muted-500">Monthly Revenue: {formatPrice(stats.monthlyRevenue)}</p>
              <p className="text-xs text-muted-400">Last Month: {formatPrice(stats.lastMonthRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary-800">Quick Stats</h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                <span className="text-muted-600">Delivered Orders</span>
              </div>
              <span className="font-medium text-secondary-800">{stats.deliveredOrders}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                <span className="text-muted-600">Pending Orders</span>
              </div>
              <span className="font-medium text-secondary-800">{stats.pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="text-muted-600">Active Products</span>
              </div>
              <span className="font-medium text-secondary-800">{stats.activeProducts}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="text-muted-600">Total Sellers</span>
              </div>
              <span className="font-medium text-secondary-800">{stats.totalSellers}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-secondary-400" />
                <span className="text-muted-600">Total Users</span>
              </div>
              <span className="font-medium text-secondary-800">{stats.totalUsers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
