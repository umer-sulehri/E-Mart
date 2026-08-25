'use client';

import { useState } from 'react';
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  UserPlus,
  PackageCheck,
  AlertTriangle,
  MessageSquare,
  Star,
  Clock,
  CreditCard,
  Truck,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { cn, formatPrice, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

const stats = [
  { label: 'Total Users', value: '1,250', icon: Users, change: '+12%', up: true, color: 'bg-primary-100 text-primary-600' },
  { label: 'Total Sellers', value: '85', icon: Store, change: '+8%', up: true, color: 'bg-success-100 text-success-600' },
  { label: 'Total Products', value: '2,340', icon: Package, change: '+15%', up: true, color: 'bg-warning-100 text-warning-600' },
  { label: 'Total Orders', value: '4,560', icon: ShoppingCart, change: '+22%', up: true, color: 'bg-danger-100 text-danger-600' },
  { label: 'Revenue', value: '₨2,450,000', icon: DollarSign, change: '+18%', up: true, color: 'bg-secondary-100 text-secondary-600' },
  { label: 'Active Today', value: '128', icon: Activity, change: '-3%', up: false, color: 'bg-blue-100 text-blue-600' },
];

const recentActivity = [
  { id: '1', type: 'user', icon: UserPlus, description: 'New user registered: Ahmed Khan', timestamp: '2 min ago', color: 'text-primary' },
  { id: '2', type: 'order', icon: ShoppingCart, description: 'Order #EM-2026-4521 placed (₨3,450)', timestamp: '5 min ago', color: 'text-blue-500' },
  { id: '3', type: 'seller', icon: Store, description: 'New seller registered: Fresh Valley Farms', timestamp: '12 min ago', color: 'text-success' },
  { id: '4', type: 'product', icon: AlertTriangle, description: 'Product flagged for review: Organic Honey 500g', timestamp: '18 min ago', color: 'text-warning' },
  { id: '5', type: 'review', icon: MessageSquare, description: 'New review on Basmati Rice Premium', timestamp: '25 min ago', color: 'text-secondary' },
  { id: '6', type: 'order', icon: Truck, description: 'Order #EM-2026-4518 shipped via TCS', timestamp: '32 min ago', color: 'text-purple-500' },
  { id: '7', type: 'payment', icon: CreditCard, description: 'Payment received: ₨12,500 from Order #EM-2026-4515', timestamp: '45 min ago', color: 'text-success' },
  { id: '8', type: 'user', icon: Eye, description: 'Admin user logged in from new IP: 182.178.45.12', timestamp: '1 hr ago', color: 'text-secondary' },
  { id: '9', type: 'product', icon: PackageCheck, description: 'Product restocked: Olper\'s Milk 1L x 50 units', timestamp: '1.5 hr ago', color: 'text-primary' },
  { id: '10', type: 'order', icon: RefreshCw, description: 'Refund processed for Order #EM-2026-4480', timestamp: '2 hr ago', color: 'text-danger' },
];

const topSellers = [
  { name: 'Fresh Valley Farms', revenue: '₨580,000', orders: 342, rating: 4.8 },
  { name: 'Organic Basket', revenue: '₨420,000', orders: 285, rating: 4.7 },
  { name: 'Karachi Meats', revenue: '₨390,000', orders: 260, rating: 4.6 },
  { name: 'Green Grocery', revenue: '₨310,000', orders: 198, rating: 4.5 },
  { name: 'Dairy Direct', revenue: '₨275,000', orders: 175, rating: 4.4 },
];

const topProducts = [
  { name: 'Basmati Rice Premium 5kg', seller: 'Fresh Valley Farms', sold: 1240, revenue: '₨248,000' },
  { name: "Olper's Milk 1L", seller: 'Dairy Direct', sold: 980, revenue: '₨98,000' },
  { name: 'Organic Chicken Breast 1kg', seller: 'Karachi Meats', sold: 856, revenue: '₨171,200' },
  { name: 'Fresh Tomatoes 1kg', seller: 'Green Grocery', sold: 745, revenue: '₨37,250' },
  { name: 'Nestle Pure Water 1.5L', seller: 'Organic Basket', sold: 690, revenue: '₨41,400' },
];

const systemAlerts = [
  { id: '1', severity: 'warning', message: '5 sellers pending approval', time: '10 min ago' },
  { id: '2', severity: 'danger', message: '3 products flagged for inappropriate content', time: '30 min ago' },
  { id: '3', severity: 'info', message: 'System backup completed successfully', time: '1 hr ago' },
  { id: '4', severity: 'warning', message: 'Stock low: 12 products below threshold', time: '2 hr ago' },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Admin Dashboard</h1>
          <p className="text-sm text-muted-500">Overview of your marketplace</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium',
                  stat.up ? 'text-success' : 'text-danger'
                )}
              >
                {stat.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {stat.change}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-secondary-800">{stat.value}</p>
            <p className="text-xs text-muted-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-800">Revenue Overview</h2>
            <select className="rounded-lg border border-muted-200 bg-white px-3 py-1.5 text-sm text-secondary-700">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <div className="mt-4 flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted-200 bg-muted-50">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-300" />
              <p className="mt-2 text-sm text-muted-500">Revenue Chart</p>
              <p className="text-xs text-muted-400">Connect Chart.js for live data</p>
            </div>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary-800">Orders by Status</h2>
          <div className="mt-4 flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted-200 bg-muted-50">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full border-4 border-muted-200 border-t-primary" />
              <p className="mt-2 text-sm text-muted-500">Pie Chart</p>
              <p className="text-xs text-muted-400">Connect chart library</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { status: 'Pending', count: 245, color: 'bg-yellow-500', pct: '12%' },
              { status: 'Processing', count: 180, color: 'bg-indigo-500', pct: '9%' },
              { status: 'Shipped', count: 520, color: 'bg-purple-500', pct: '26%' },
              { status: 'Delivered', count: 890, color: 'bg-success', pct: '44%' },
              { status: 'Cancelled', count: 175, color: 'bg-danger', pct: '9%' },
            ].map((s) => (
              <div key={s.status} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2.5 w-2.5 rounded-full', s.color)} />
                  <span className="text-muted-600">{s.status}</span>
                </div>
                <span className="font-medium text-secondary-800">{s.count} ({s.pct})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-800">Recent Activity</h2>
            <button className="text-xs font-medium text-primary hover:underline">View All</button>
          </div>
          <div className="mt-4 max-h-[420px] space-y-4 overflow-y-auto">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted-50', item.color)}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-secondary-800">{item.description}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-400">
                    <Clock className="h-3 w-3" />
                    {item.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Sellers */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-800">Top Sellers</h2>
            <button className="text-xs font-medium text-primary hover:underline">View All</button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-muted-100">
                  <th className="pb-2 font-medium text-muted-500">Seller</th>
                  <th className="pb-2 font-medium text-muted-500">Revenue</th>
                  <th className="pb-2 font-medium text-muted-500">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-50">
                {topSellers.map((seller, i) => (
                  <tr key={seller.name}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-medium text-secondary-800">{seller.name}</p>
                          <p className="text-xs text-muted-500">{seller.orders} orders</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-medium text-secondary-800">{seller.revenue}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        <span className="text-secondary-800">{seller.rating}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-800">Top Products</h2>
            <button className="text-xs font-medium text-primary hover:underline">View All</button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-muted-100">
                  <th className="pb-2 font-medium text-muted-500">Product</th>
                  <th className="pb-2 font-medium text-muted-500">Sold</th>
                  <th className="pb-2 font-medium text-muted-500">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-50">
                {topProducts.map((product, i) => (
                  <tr key={product.name}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-warning-100 text-xs font-bold text-warning-700">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-medium text-secondary-800">{product.name}</p>
                          <p className="text-xs text-muted-500">{product.seller}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-secondary-800">{product.sold.toLocaleString()}</td>
                    <td className="py-3 font-medium text-secondary-800">{product.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-secondary-800">System Alerts</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {systemAlerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'rounded-lg border p-4',
                alert.severity === 'warning' && 'border-warning-200 bg-warning-50',
                alert.severity === 'danger' && 'border-danger-200 bg-danger-50',
                alert.severity === 'info' && 'border-blue-200 bg-blue-50'
              )}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0',
                    alert.severity === 'warning' && 'text-warning',
                    alert.severity === 'danger' && 'text-danger',
                    alert.severity === 'info' && 'text-blue-500'
                  )}
                />
                <div>
                  <p className="text-sm font-medium text-secondary-800">{alert.message}</p>
                  <p className="mt-1 text-xs text-muted-500">{alert.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarChart3(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}
