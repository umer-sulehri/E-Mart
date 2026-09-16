'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import toast from 'react-hot-toast';
import {
  DollarSign,
  Package,
  ShoppingBag,
  Star,
  ChevronRight,
  TrendingUp,
  Home,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import type { OrderRow, ProductRow } from '@/types/supabase';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const statusVariant: Record<string, 'success' | 'warning' | 'primary' | 'danger' | 'default'> = {
  delivered: 'success',
  processing: 'warning',
  shipped: 'primary',
  out_for_delivery: 'primary',
  confirmed: 'primary',
  cancelled: 'danger',
  pending: 'default',
};

type SectionKey = 'earnings' | 'orders' | 'products' | 'trend';

function SkeletonLine({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted-200 ${className ?? 'h-4 w-full'}`} />;
}

function StatSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
      <div className="h-12 w-12 animate-pulse rounded-xl bg-muted-200" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-3 w-20" />
        <SkeletonLine className="h-6 w-28" />
      </div>
    </div>
  );
}

function SectionError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-danger-50 p-3 text-sm text-danger">
      <span className="inline-flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        {message}
      </span>
      <button
        onClick={onRetry}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-danger-600"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  );
}

export default function SellerDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<SectionKey, string>>>({});
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    activeProducts: 0,
    netEarnings: 0,
    commissionRate: 0,
    monthlyRevenue: 0,
    totalProductsSold: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [topProducts, setTopProducts] = useState<ProductRow[]>([]);
  const [trend, setTrend] = useState<{ label: string; revenue: number; orders: number }[]>([]);

  const fetchSection = useCallback(
    async (key: SectionKey, url: string, setData: (data: any) => void) => {
      try {
        const res = await fetch(url);
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setSectionErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
          });
        } else {
          throw new Error(json.error || `Failed to load ${key}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to load ${key} data`;
        console.error(`[seller dashboard] ${key} error:`, err);
        setSectionErrors((prev) => ({ ...prev, [key]: message }));
      }
    },
    [router]
  );

  const fetchAll = useCallback(async () => {
    setSectionErrors({});
    setLoading(true);
    await Promise.allSettled([
      fetchSection('earnings', '/api/v1/seller/earnings', (data) => setStats(data)),
      fetchSection('orders', '/api/v1/seller/orders?limit=5', (data) => setRecentOrders(data || [])),
      fetchSection('products', '/api/v1/seller/products?limit=5', (data) => setTopProducts(data || [])),
      fetchSection('trend', '/api/v1/seller/earnings/trend', (data) => setTrend(data || [])),
    ]);
    setLoading(false);
  }, [fetchSection]);

  const retrySection = useCallback(
    (key: SectionKey) => {
      const map: Record<SectionKey, { url: string; set: (d: any) => void }> = {
        earnings: { url: '/api/v1/seller/earnings', set: (d) => setStats(d) },
        orders: { url: '/api/v1/seller/orders?limit=5', set: (d) => setRecentOrders(d || []) },
        products: { url: '/api/v1/seller/products?limit=5', set: (d) => setTopProducts(d || []) },
        trend: { url: '/api/v1/seller/earnings/trend', set: (d) => setTrend(d || []) },
      };
      fetchSection(key, map[key].url, map[key].set);
    },
    [fetchSection]
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, bg: 'bg-primary' },
    { label: 'Total Orders', value: String(stats.totalOrders), icon: Package, bg: 'bg-success' },
    { label: 'Active Products', value: String(stats.activeProducts), icon: ShoppingBag, bg: 'bg-warning' },
    { label: 'Net Earnings', value: formatPrice(stats.netEarnings), icon: TrendingUp, bg: 'bg-danger' },
  ];

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <nav className="flex items-center gap-2 text-sm text-muted-500">
          <Link href="/" className="inline-flex items-center gap-1 text-muted-500 transition-colors hover:text-primary">
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-secondary-800">Seller Dashboard</span>
        </nav>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-secondary-800">
                Welcome back, {user?.firstName ?? 'Seller'}!
              </h2>
              <p className="mt-1 text-sm text-muted-500">
                Here&apos;s an overview of your store performance.
              </p>
            </div>
            <button
              onClick={fetchAll}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-muted-200 px-3 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-muted-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          {sectionErrors.earnings && (
            <div className="mt-4">
              <SectionError message={sectionErrors.earnings} onRetry={() => retrySection('earnings')} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
            : statCards.map((stat) => (
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

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-secondary-800">Sales Overview</h3>
          {sectionErrors.trend && (
            <div className="mb-4">
              <SectionError message={sectionErrors.trend} onRetry={() => retrySection('trend')} />
            </div>
          )}
          <div className="h-[300px]">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <SkeletonLine className="h-64 w-full" />
              </div>
            ) : trend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-500">
                No sales data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#6BB252" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-muted-100 p-6">
              <h3 className="text-lg font-bold text-secondary-800">Recent Orders</h3>
              <Link href="/seller/orders" className="text-sm font-medium text-primary hover:text-primary-500">
                View All
              </Link>
            </div>
            {sectionErrors.orders && (
              <div className="p-6">
                <SectionError message={sectionErrors.orders} onRetry={() => retrySection('orders')} />
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-muted-100 bg-muted-50">
                    <th className="px-6 py-3 font-medium text-muted-600">Order ID</th>
                    <th className="px-6 py-3 font-medium text-muted-600">Customer</th>
                    <th className="px-6 py-3 font-medium text-muted-600">Items</th>
                    <th className="px-6 py-3 font-medium text-muted-600">Total</th>
                    <th className="px-6 py-3 font-medium text-muted-600">Status</th>
                    <th className="px-6 py-3 font-medium text-muted-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-muted-50">
                          <td className="px-6 py-4"><SkeletonLine className="h-4 w-24" /></td>
                          <td className="px-6 py-4"><SkeletonLine className="h-4 w-20" /></td>
                          <td className="px-6 py-4"><SkeletonLine className="h-4 w-10" /></td>
                          <td className="px-6 py-4"><SkeletonLine className="h-4 w-16" /></td>
                          <td className="px-6 py-4"><SkeletonLine className="h-4 w-16" /></td>
                          <td className="px-6 py-4"><SkeletonLine className="h-4 w-20" /></td>
                        </tr>
                      ))
                    : recentOrders.map((order: OrderRow) => (
                        <tr key={order.id} className="border-b border-muted-50 transition-colors hover:bg-muted-50/50">
                          <td className="px-6 py-4 font-medium text-secondary-800">{order.order_number}</td>
                          <td className="px-6 py-4 text-muted-600">
                            {order.profiles?.first_name} {order.profiles?.last_name}
                          </td>
                          <td className="px-6 py-4 text-muted-600">
                            {order.order_items?.length ?? 0} items
                          </td>
                          <td className="px-6 py-4 font-semibold text-secondary-800">
                            {formatPrice(order.total)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={statusVariant[order.status] ?? 'default'}>
                              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-muted-600">{formatDate(order.created_at)}</td>
                        </tr>
                      ))}
                  {!loading && sectionErrors.orders == null && recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-500">
                        No orders yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-muted-100 p-6">
              <h3 className="text-lg font-bold text-secondary-800">Top Products</h3>
              <Link href="/seller/products" className="text-sm font-medium text-primary hover:text-primary-500">
                View All
              </Link>
            </div>
            {sectionErrors.products && (
              <div className="p-6">
                <SectionError message={sectionErrors.products} onRetry={() => retrySection('products')} />
              </div>
            )}
            <div className="divide-y divide-muted-50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-4">
                      <SkeletonLine className="h-8 w-8 rounded-full" />
                      <SkeletonLine className="h-12 w-12 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2">
                        <SkeletonLine className="h-4 w-3/4" />
                        <SkeletonLine className="h-3 w-1/4" />
                      </div>
                      <SkeletonLine className="h-4 w-16" />
                    </div>
                  ))
                : topProducts.map((product: ProductRow, index: number) => (
                    <div key={product.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted-50/50">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
                        {index + 1}
                      </span>
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted-100">
                        {product.images?.[0] ? (
                          <ImageWithFallback src={product.images[0]} alt={product.name} width={60} height={60} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-400">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-secondary-800">{product.name}</p>
                        <p className="text-xs text-muted-500">{product.categories?.name ?? 'Uncategorized'}</p>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-secondary-800">
                        {formatPrice(product.discount_price || product.price)}
                      </p>
                    </div>
                  ))}
              {!loading && sectionErrors.products == null && topProducts.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-muted-500">
                  No products yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
