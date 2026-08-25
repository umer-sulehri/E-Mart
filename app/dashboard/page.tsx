'use client';

import Link from 'next/link';
import {
  Package,
  DollarSign,
  Heart,
  Clock,
  Eye,
  RotateCcw,
  Navigation,
  PenLine,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const stats = [
  {
    label: 'Total Orders',
    value: '12',
    icon: Package,
    bg: 'bg-primary',
  },
  {
    label: 'Total Spent',
    value: formatPrice(45250),
    icon: DollarSign,
    bg: 'bg-success',
  },
  {
    label: 'Wishlist Items',
    value: '8',
    icon: Heart,
    bg: 'bg-danger',
  },
  {
    label: 'Pending Orders',
    value: '2',
    icon: Clock,
    bg: 'bg-warning',
  },
];

const recentOrders = [
  {
    id: 'EM-2026-10482',
    date: '2026-08-20',
    status: 'delivered',
    items: 3,
    total: 4850,
  },
  {
    id: 'EM-2026-10471',
    date: '2026-08-18',
    status: 'shipped',
    items: 5,
    total: 8920,
  },
  {
    id: 'EM-2026-10459',
    date: '2026-08-15',
    status: 'processing',
    items: 2,
    total: 3200,
  },
  {
    id: 'EM-2026-10445',
    date: '2026-08-12',
    status: 'delivered',
    items: 7,
    total: 12340,
  },
  {
    id: 'EM-2026-10430',
    date: '2026-08-08',
    status: 'cancelled',
    items: 1,
    total: 1950,
  },
];

const statusVariant: Record<string, 'success' | 'warning' | 'primary' | 'danger'> = {
  delivered: 'success',
  processing: 'warning',
  shipped: 'primary',
  cancelled: 'danger',
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-secondary-800">
          Welcome back, {user?.firstName ?? 'User'}!
        </h2>
        <p className="mt-1 text-sm text-muted-500">
          Here&apos;s an overview of your account activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} text-white`}
            >
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-500">{stat.label}</p>
              <p className="text-xl font-bold text-secondary-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
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
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-muted-50 transition-colors hover:bg-muted-50/50"
                >
                  <td className="px-6 py-4 font-medium text-secondary-800">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 text-muted-600">
                    {formatDate(order.date)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusVariant[order.status]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-600">{order.items} items</td>
                  <td className="px-6 py-4 text-right font-semibold text-secondary-800">
                    {formatPrice(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
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
