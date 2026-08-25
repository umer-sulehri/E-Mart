'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  DollarSign,
  Package,
  ShoppingBag,
  Star,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

const statusVariant: Record<string, 'success' | 'warning' | 'primary' | 'danger' | 'default'> = {
  delivered: 'success',
  processing: 'warning',
  shipped: 'primary',
  out_for_delivery: 'primary',
  confirmed: 'primary',
  cancelled: 'danger',
  pending: 'default',
};

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

export default function SellerDashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
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
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [earningsRes, ordersRes, productsRes] = await Promise.all([
          fetch('/api/v1/seller/earnings'),
          fetch('/api/v1/seller/orders?limit=5'),
          fetch('/api/v1/seller/products?limit=5'),
        ]);

        const earningsData = await earningsRes.json();
        if (earningsData.success) {
          setStats(earningsData.data);
        }

        const ordersData = await ordersRes.json();
        if (ordersData.success) {
          setRecentOrders(ordersData.data || []);
        }

        const productsData = await productsRes.json();
        if (productsData.success) {
          setTopProducts(productsData.data || []);
        }
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, bg: 'bg-primary' },
    { label: 'Total Orders', value: String(stats.totalOrders), icon: Package, bg: 'bg-success' },
    { label: 'Active Products', value: String(stats.activeProducts), icon: ShoppingBag, bg: 'bg-warning' },
    { label: 'Net Earnings', value: formatPrice(stats.netEarnings), icon: TrendingUp, bg: 'bg-danger' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-secondary-800">
          Welcome back, {user?.firstName ?? 'Seller'}!
        </h2>
        <p className="mt-1 text-sm text-muted-500">
          Here&apos;s an overview of your store performance.
        </p>
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
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ height: 300, background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #ede9fe 100%)' }}
        >
          <p className="text-lg font-semibold text-muted-500">Sales Overview Chart</p>
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
                  : recentOrders.map((order: any) => (
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
                {!loading && recentOrders.length === 0 && (
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
              : topProducts.map((product: any, index: number) => (
                  <div key={product.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted-50/50">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
                      {index + 1}
                    </span>
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted-100">
                      {product.images?.[0] ? (
                        <Image src={product.images[0]} alt={product.name} width={60} height={60} className="h-full w-full object-cover" />
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
            {!loading && topProducts.length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-muted-500">
                No products yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
