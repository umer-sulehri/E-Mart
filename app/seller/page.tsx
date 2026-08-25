'use client';

import Link from 'next/link';
import {
  DollarSign,
  Package,
  ShoppingBag,
  Star,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const stats = [
  {
    label: 'Total Revenue',
    value: formatPrice(125400),
    icon: DollarSign,
    bg: 'bg-primary',
  },
  {
    label: 'Total Orders',
    value: '45',
    icon: Package,
    bg: 'bg-success',
  },
  {
    label: 'Total Products',
    value: '18',
    icon: ShoppingBag,
    bg: 'bg-warning',
  },
  {
    label: 'Average Rating',
    value: '4.7',
    icon: Star,
    bg: 'bg-danger',
  },
];

const recentOrders = [
  { id: 'EM-2026-10482', customer: 'Ahmed Khan', items: 3, total: 4850, status: 'delivered', date: '2026-08-20' },
  { id: 'EM-2026-10471', customer: 'Fatima Ali', items: 5, total: 8920, status: 'shipped', date: '2026-08-18' },
  { id: 'EM-2026-10459', customer: 'Hassan Raza', items: 2, total: 3200, status: 'processing', date: '2026-08-15' },
  { id: 'EM-2026-10445', customer: 'Sara Malik', items: 7, total: 12340, status: 'delivered', date: '2026-08-12' },
  { id: 'EM-2026-10430', customer: 'Usman Tariq', items: 1, total: 1950, status: 'cancelled', date: '2026-08-08' },
];

const topProducts = [
  { name: 'Organic Basmati Rice 5kg', image: '/images/products/rice.jpg', sold: 120, revenue: 239880 },
  { name: 'Fresh Milk 1L (Pack of 6)', image: '/images/products/milk.jpg', sold: 95, revenue: 119805 },
  { name: 'Premium Olive Oil 500ml', image: '/images/products/olive-oil.jpg', sold: 78, revenue: 171420 },
  { name: 'Alphonso Mangoes 1kg', image: '/images/products/mango.jpg', sold: 65, revenue: 77935 },
  { name: 'Chicken Breast Boneless 1kg', image: '/images/products/chicken.jpg', sold: 54, revenue: 75546 },
];

const statusVariant: Record<string, 'success' | 'warning' | 'primary' | 'danger'> = {
  delivered: 'success',
  processing: 'warning',
  shipped: 'primary',
  cancelled: 'danger',
};

export default function SellerDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-secondary-800">
          Welcome back, {user?.firstName ?? 'Seller'}!
        </h2>
        <p className="mt-1 text-sm text-muted-500">
          Here&apos;s an overview of your store performance.
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

      {/* Sales Chart Placeholder */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-secondary-800">Sales Overview</h3>
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ height: 300, background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #ede9fe 100%)' }}
        >
          <p className="text-lg font-semibold text-muted-500">Sales Overview Chart</p>
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-muted-100 p-6">
            <h3 className="text-lg font-bold text-secondary-800">Recent Orders</h3>
            <Link
              href="/seller/orders"
              className="text-sm font-medium text-primary hover:text-primary-500"
            >
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
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-muted-50 transition-colors hover:bg-muted-50/50"
                  >
                    <td className="px-6 py-4 font-medium text-secondary-800">{order.id}</td>
                    <td className="px-6 py-4 text-muted-600">{order.customer}</td>
                    <td className="px-6 py-4 text-muted-600">{order.items} items</td>
                    <td className="px-6 py-4 font-semibold text-secondary-800">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant[order.status]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-600">{formatDate(order.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-muted-100 p-6">
            <h3 className="text-lg font-bold text-secondary-800">Top Products</h3>
            <Link
              href="/seller/products"
              className="text-sm font-medium text-primary hover:text-primary-500"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-muted-50">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted-50/50">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
                  {index + 1}
                </span>
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-secondary-800">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-500">{product.sold} sold</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-secondary-800">
                  {formatPrice(product.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
