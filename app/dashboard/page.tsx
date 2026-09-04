'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  DollarSign,
  Heart,
  Clock,
  RotateCcw,
  Navigation,
  PenLine,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import type { Order } from '@/types';

const statusVariant: Record<string, 'success' | 'warning' | 'primary' | 'danger'> = {
  delivered: 'success',
  processing: 'warning',
  shipped: 'primary',
  cancelled: 'danger',
  pending: 'warning',
  confirmed: 'primary',
  out_for_delivery: 'primary',
  returned: 'danger',
  refunded: 'warning',
};

export default function DashboardPage() {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const router = useRouter();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, pendingOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const meRes = await fetch('/api/v1/auth/me');
        if (meRes.status === 401) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        if (meData.success) {
          setUser(meData.data);
        }

        const ordersRes = await fetch('/api/v1/orders?limit=5');
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (ordersData.success) {
            setRecentOrders(ordersData.data || []);
            setStats({
              totalOrders: ordersData.meta?.totalItems || ordersData.data?.length || 0,
              totalSpent: ordersData.summary?.totalSpent ?? 0,
              pendingOrders: ordersData.summary?.pendingCount ?? 0,
            });
          }
        }
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setUser, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangle" height={100} className="w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangle" height={90} className="w-full" />
          ))}
        </div>
        <Skeleton variant="rectangle" height={300} className="w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm">
        <p className="text-lg font-semibold text-danger">{error}</p>
        <Button variant="primary" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-secondary-800">
          Welcome back, {user?.firstName ?? 'User'}!
        </h2>
        <p className="mt-1 text-sm text-muted-500">
          Here&apos;s an overview of your account activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-500">Total Orders</p>
            <p className="text-xl font-bold text-secondary-800">{stats.totalOrders}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success text-white">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-500">Total Spent</p>
            <p className="text-xl font-bold text-secondary-800">{formatPrice(stats.totalSpent)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger text-white">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-500">Wishlist Items</p>
            <p className="text-xl font-bold text-secondary-800">&mdash;</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning text-white">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-500">Pending Orders</p>
            <p className="text-xl font-bold text-secondary-800">{stats.pendingOrders}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-muted-100 p-6">
          <h3 className="text-lg font-bold text-secondary-800">Recent Orders</h3>
          <Link
            href="/dashboard/orders"
            className="text-sm font-medium text-primary hover:text-primary-500"
          >
            View All Orders
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100 bg-muted-50">
                <th className="px-6 py-3 font-medium text-muted-600">Order ID</th>
                <th className="px-6 py-3 font-medium text-muted-600">Date</th>
                <th className="px-6 py-3 font-medium text-muted-600">Status</th>
                <th className="px-6 py-3 font-medium text-muted-600">Items</th>
                <th className="px-6 py-3 font-medium text-muted-600 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-500">
                    No orders yet. Start shopping to see your orders here.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-muted-50 transition-colors hover:bg-muted-50/50"
                  >
                    <td className="px-6 py-4 font-medium text-secondary-800">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-muted-600">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant[order.status] ?? 'warning'}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-600">
                      {order.items?.length ?? 0} items
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-secondary-800">
                      {formatPrice(order.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-secondary-800">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4" />
              Re-Order
            </Button>
          </Link>
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm">
              <Navigation className="h-4 w-4" />
              Track Order
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" size="sm">
              <PenLine className="h-4 w-4" />
              Write Review
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
