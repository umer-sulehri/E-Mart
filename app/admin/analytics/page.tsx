'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  PackageCheck,
  Clock,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { cn, formatPrice } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  monthlyRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: number;
}

interface MonthlyPoint {
  label: string;
  revenue: number;
  orders: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconClass: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg', iconClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-secondary-800">{value}</p>
          <p className="text-xs text-muted-500">{label}</p>
        </div>
      </div>
      {sub && <div className="mt-3">{sub}</div>}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [series, setSeries] = useState<MonthlyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [statsRes, seriesRes] = await Promise.all([
          fetch('/api/v1/admin/analytics/dashboard'),
          fetch('/api/v1/admin/analytics/orders'),
        ]);
        const statsJson = await statsRes.json();
        const seriesJson = await seriesRes.json();

        if (cancelled) return;

        if (statsJson.success) setStats(statsJson.data);
        if (seriesJson.success) setSeries(seriesJson.data || []);
      } catch {
        if (!cancelled) setError('Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-danger">{error || 'Analytics unavailable'}</p>
      </div>
    );
  }

  const growthPositive = stats.revenueGrowth >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">Analytics</h1>
        <p className="text-sm text-muted-500">Business performance overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue (this month)"
          value={formatPrice(stats.monthlyRevenue)}
          icon={IndianRupee}
          iconClass="bg-primary-100 text-primary-600"
          sub={
            <span className={cn('inline-flex items-center gap-1 text-xs font-medium', growthPositive ? 'text-success' : 'text-danger')}>
              {growthPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(stats.revenueGrowth)}% vs last month
            </span>
          }
        />
        <StatCard
          label="Total Orders"
          value={String(stats.totalOrders)}
          icon={ShoppingCart}
          iconClass="bg-warning-100 text-warning-600"
          sub={
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-500">
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 text-warning" /> {stats.pendingOrders} pending</span>
              <span className="inline-flex items-center gap-1"><PackageCheck className="h-3 w-3 text-success" /> {stats.deliveredOrders} delivered</span>
            </div>
          }
        />
        <StatCard
          label="Total Users"
          value={String(stats.totalUsers)}
          icon={Users}
          iconClass="bg-success-100 text-success-600"
        />
        <StatCard
          label="Total Sellers"
          value={String(stats.totalSellers)}
          icon={Store}
          iconClass="bg-danger-100 text-danger-600"
        />
      </div>

      {/* Revenue line chart */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-secondary-800">Revenue (last 6 months)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                formatter={(value, name) =>
                  name === 'revenue'
                    ? [formatPrice(Number(value) || 0), 'Revenue']
                    : [Number(value) || 0, 'Orders']
                }
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" name="Revenue (Rs)" stroke="#6BB252" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders bar chart */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-secondary-800">Orders (last 6 months)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="orders" name="Orders" fill="#a3be4c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inventory summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total Products"
          value={String(stats.totalProducts)}
          icon={Package}
          iconClass="bg-muted-100 text-secondary-700"
        />
        <StatCard
          label="Active Products"
          value={String(stats.activeProducts)}
          icon={PackageCheck}
          iconClass="bg-primary-100 text-primary-600"
        />
      </div>
    </div>
  );
}
