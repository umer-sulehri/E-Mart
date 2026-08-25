'use client';

import { useState } from 'react';
import {
  BarChart3,
  Users,
  ShoppingBag,
  Store,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  Star,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState('30d');

  const reports = [
    {
      title: 'Sales Report',
      icon: DollarSign,
      color: 'bg-primary-100 text-primary-600',
      metrics: [
        { label: 'Total Revenue', value: '₨2,450,000', change: '+18%', up: true },
        { label: 'Total Orders', value: '4,560', change: '+22%', up: true },
        { label: 'Average Order Value', value: '₨537', change: '+5%', up: true },
        { label: 'Refunds', value: '₨45,000', change: '-12%', up: false },
      ],
      chartColor: 'bg-primary-100',
    },
    {
      title: 'User Growth',
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      metrics: [
        { label: 'New Users', value: '320', change: '+15%', up: true },
        { label: 'Active Users', value: '1,250', change: '+8%', up: true },
        { label: 'Retention Rate', value: '68%', change: '+3%', up: true },
        { label: 'Churn Rate', value: '4.2%', change: '-1%', up: false },
      ],
      chartColor: 'bg-blue-100',
    },
    {
      title: 'Product Performance',
      icon: ShoppingBag,
      color: 'bg-warning-100 text-warning-600',
      metrics: [
        { label: 'Total Products', value: '2,340', change: '+15%', up: true },
        { label: 'Top Seller', value: 'Basmati Rice', change: '', up: true },
        { label: 'Avg Rating', value: '4.3', change: '+0.2', up: true },
        { label: 'Low Stock Items', value: '12', change: '', up: false },
      ],
      chartColor: 'bg-warning-100',
    },
    {
      title: 'Seller Performance',
      icon: Store,
      color: 'bg-success-100 text-success-600',
      metrics: [
        { label: 'Active Sellers', value: '85', change: '+8', up: true },
        { label: 'Top Seller', value: 'Fresh Valley Farms', change: '', up: true },
        { label: 'Avg Rating', value: '4.5', change: '+0.1', up: true },
        { label: 'Pending Approvals', value: '5', change: '', up: false },
      ],
      chartColor: 'bg-success-100',
    },
  ];

  const topCategories = [
    { name: 'Fruits & Vegetables', revenue: '₨520,000', orders: 1240, pct: 21 },
    { name: 'Meat & Poultry', revenue: '₨480,000', orders: 856, pct: 20 },
    { name: 'Dairy & Eggs', revenue: '₨390,000', orders: 980, pct: 16 },
    { name: 'Beverages', revenue: '₨310,000', orders: 690, pct: 13 },
    { name: 'Snacks', revenue: '₨275,000', orders: 520, pct: 11 },
    { name: 'Bakery', revenue: '₨210,000', orders: 420, pct: 9 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Reports & Analytics</h1>
          <p className="text-sm text-muted-500">Platform performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-700 focus:border-primary focus:outline-none"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {reports.map((report) => (
          <div key={report.title} className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', report.color)}>
                  <report.icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-secondary-800">{report.title}</h2>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {/* Chart Placeholder */}
            <div className={cn('mt-4 flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted-200', report.chartColor)}>
              <div className="text-center">
                <BarChart3 className="mx-auto h-10 w-10 text-muted-300" />
                <p className="mt-1 text-sm text-muted-500">Chart Visualization</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {report.metrics.map((m) => (
                <div key={m.label} className="rounded-lg bg-muted-50 p-3">
                  <p className="text-xs text-muted-500">{m.label}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <p className="text-lg font-bold text-secondary-800">{m.value}</p>
                    {m.change && (
                      <span className={cn('inline-flex items-center text-xs font-medium', m.up ? 'text-success' : 'text-danger')}>
                        {m.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {m.change}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary-800">Revenue by Category</h2>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100">
                <th className="pb-3 font-medium text-muted-500">Category</th>
                <th className="pb-3 font-medium text-muted-500">Revenue</th>
                <th className="hidden pb-3 font-medium text-muted-500 md:table-cell">Orders</th>
                <th className="pb-3 font-medium text-muted-500">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-50">
              {topCategories.map((cat) => (
                <tr key={cat.name}>
                  <td className="py-3 font-medium text-secondary-800">{cat.name}</td>
                  <td className="py-3 font-medium text-secondary-800">{cat.revenue}</td>
                  <td className="hidden py-3 text-muted-600 md:table-cell">{cat.orders.toLocaleString()}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted-100">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${cat.pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-500">{cat.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
