'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  RefreshCw,
  UserPlus,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { cn, formatPrice, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#06b6d4',
  out_for_delivery: '#f97316',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  returned: '#64748b',
  refunded: '#a3be4c',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  profiles?: { first_name: string; last_name: string; email: string } | null;
}

interface RecentUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface PendingSeller {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
}

interface DashboardData {
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
  recentOrders: RecentOrder[];
  recentUsers: RecentUser[];
  pendingSellers: PendingSeller[];
  orderStatusCounts: Record<string, number>;
}

interface MonthlyPoint {
  label: string;
  revenue: number;
  orders: number;
}

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
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [series, setSeries] = useState<MonthlyPoint[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, seriesRes] = await Promise.all([
        fetch('/api/v1/admin/analytics/dashboard'),
        fetch('/api/v1/admin/analytics/orders'),
      ]);
      const dash = await dashRes.json();
      const s = await seriesRes.json();
      if (dash.success) setStats(dash.data);
      else toast.error(dash.error || 'Failed to load dashboard');
      if (s.success) setSeries(s.data || []);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <SkeletonBlock className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <SkeletonBlock className="h-72 lg:col-span-2" />
          <SkeletonBlock className="h-72" />
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, change: `+${stats.revenueGrowth}%`, up: stats.revenueGrowth >= 0, color: 'bg-primary-100 text-primary-600', href: '/admin/users' },
    { label: 'Total Sellers', value: stats.totalSellers.toLocaleString(), icon: Store, change: `${stats.pendingSellers.length} pending`, up: true, color: 'bg-success-100 text-success-600', href: '/admin/sellers' },
    { label: 'Total Products', value: stats.totalProducts.toLocaleString(), icon: Package, change: `${stats.activeProducts} active`, up: true, color: 'bg-warning-100 text-warning-600', href: '/admin/products' },
    { label: 'Total Orders', value: stats.totalOrders.toLocaleString(), icon: ShoppingCart, change: `${stats.pendingOrders} pending`, up: true, color: 'bg-danger-100 text-danger-600', href: '/admin/orders' },
    { label: 'Revenue', value: formatPrice(stats.monthlyRevenue), icon: DollarSign, change: `${stats.revenueGrowth}%`, up: stats.revenueGrowth >= 0, color: 'bg-secondary-100 text-secondary-600', href: '/admin/analytics' },
    { label: 'Delivered', value: stats.deliveredOrders.toLocaleString(), icon: Activity, change: '', up: true, color: 'bg-blue-100 text-blue-600', href: '/admin/orders' },
  ];

  const statusData = Object.entries(stats.orderStatusCounts || {})
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ name: STATUS_LABELS[status] || status, value: count }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Admin Dashboard</h1>
          <p className="text-sm text-muted-500">Overview of your marketplace</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
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
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-800">Revenue Overview</h2>
            <Link href="/admin/analytics" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-500">
              View analytics <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4 h-64">
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

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary-800">Order Status</h2>
          {statusData.length === 0 ? (
            <p className="mt-4 text-sm text-muted-500">No orders yet.</p>
          ) : (
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name.toLowerCase()] || '#a3be4c'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-800">Recent Orders</h2>
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-500">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-muted-500">No orders yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-muted-200 text-xs uppercase tracking-wide text-muted-500">
                    <th className="pb-2 pr-4 font-medium">Order</th>
                    <th className="pb-2 pr-4 font-medium">Customer</th>
                    <th className="pb-2 pr-4 font-medium">Total</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-muted-100 last:border-0">
                      <td className="py-2.5 pr-4 font-medium text-secondary-800">
                        <Link href={`/admin/orders?id=${o.id}`} className="hover:text-primary">
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-muted-600">
                        {o.profiles
                          ? `${o.profiles.first_name} ${o.profiles.last_name}`
                          : '—'}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-secondary-800">{formatPrice(o.total)}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant={o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'danger' : 'warning'}>
                          {STATUS_LABELS[o.status] || o.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-muted-500">{formatDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-secondary-800">
                <UserPlus className="h-4 w-4 text-primary" />
                Recent Registrations
              </h2>
            </div>
            {stats.recentUsers.length === 0 ? (
              <p className="mt-3 text-sm text-muted-500">No recent signups.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {stats.recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-secondary-800">
                        {u.first_name} {u.last_name}
                      </span>
                      <span className="truncate text-xs capitalize text-muted-500">
                        {u.role} · {formatDate(u.created_at)}
                      </span>
                    </div>
                    <Badge variant={u.role === 'admin' ? 'danger' : u.role === 'seller' ? 'warning' : 'default'}>
                      {u.role}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-secondary-800">
                <Clock className="h-4 w-4 text-warning" />
                Pending Sellers
              </h2>
              <Link href="/admin/sellers" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-500">
                Manage <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {stats.pendingSellers.length === 0 ? (
              <p className="mt-3 text-sm text-muted-500">No pending sellers.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {stats.pendingSellers.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-secondary-800">{s.name}</span>
                    <span className="text-xs text-muted-500">{formatDate(s.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
