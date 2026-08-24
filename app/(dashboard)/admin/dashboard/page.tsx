'use client';

import Link from 'next/link';
import { useAdminStats, useAdminAnalytics } from '@/hooks/useAdmin';
import { useAdminOrders } from '@/hooks/useOrders';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  UsersIcon,
  ProductIcon,
  OrderIcon,
  ChartBarIcon,
  PlusIcon,
  ClipboardListIcon,
  LanguageIcon,
  ArrowRightIcon,
} from '@/components/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from '@/components/ui/Charts';

const STAT_CONFIGS = [
  { key: 'users', label: 'Total Users', icon: UsersIcon, color: 'var(--color-accent)', trend: +12.5 },
  { key: 'products', label: 'Total Products', icon: ProductIcon, color: 'var(--color-primary)', trend: +8.3 },
  { key: 'orders', label: 'Total Orders', icon: OrderIcon, color: 'var(--color-warning)', trend: +15.7 },
  { key: 'revenue', label: 'Revenue', icon: ChartBarIcon, color: 'var(--color-success)', trend: +22.1 },
] as const;

function formatCurrency(amount: number) {
  if (amount >= 1_000_000) return `Rs ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `Rs ${(amount / 1_000).toFixed(1)}K`;
  return `Rs ${amount.toLocaleString()}`;
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: analytics } = useAdminAnalytics(30);
  const { data: ordersData, isLoading: ordersLoading } = useAdminOrders(1, 10);

  const statsMap: Record<string, string | number> = {
    users: stats?.totalUsers ?? '—',
    products: stats?.totalProducts ?? '—',
    orders: stats?.totalOrders ?? '—',
    revenue: stats?.totalRevenue != null ? formatCurrency(stats.totalRevenue) : '—',
  };

  const recentOrders = ordersData?.orders ?? [];
  const chartData =
    analytics?.revenueSeries.map((d) => ({
      day: d.date.slice(5),
      orders: d.orders,
      revenue: d.revenue,
    })) ?? [];

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div
        className="rounded-[16px] p-8"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
          boxShadow: '0 10px 25px rgba(255,196,63,0.3)',
        }}
      >
        <h1 className="text-3xl font-bold text-text-inverse mb-1">Admin Dashboard</h1>
        <p className="text-text-inverse/70">
          Overview of your marketplace — users, products, orders and revenue.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CONFIGS.map(({ key, label, icon: Icon, color, trend }) => {
          const isPositive = trend >= 0;
          return (
            <div
              key={key}
              className="rounded-[16px] bg-surface border border-border p-5 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <span className="text-sm text-text-secondary">{label}</span>
              </div>
              <p className="text-3xl font-bold text-text-primary">
                {statsLoading && key !== 'revenue' ? '—' : statsMap[key]}
              </p>
              <span
                className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isPositive ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                }`}
              >
                {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Chart + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 rounded-[16px] bg-surface border border-border p-6">
          <div
            className="flex items-center justify-between mb-6 pb-3"
            style={{ borderBottom: '2px solid var(--color-primary)' }}
          >
            <h3 className="font-bold text-text-primary">Orders &amp; Revenue Trend</h3>
            <span className="text-xs text-text-secondary">
              Last 30 days{analytics ? ` · Today: ${analytics.ordersToday} orders (${formatCurrency(analytics.revenueToday)})` : ''}
            </span>
          </div>
          <div className="h-72">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-secondary text-sm">
                No order data for this period yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }}
                    axisLine={{ stroke: 'var(--color-border)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 12,
                      fontSize: 13,
                    }}
                    formatter={(value: unknown, name: unknown) =>
                      name === 'revenue' ? [`Rs ${Number(value).toLocaleString()}`, 'Revenue'] : [`${value}`, `${name}`]
                    }
                  />
                  <Bar
                    dataKey="orders"
                    fill="var(--color-primary)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--color-accent)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {analytics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-text-secondary">Revenue (month)</p>
                <p className="font-bold text-text-primary">{formatCurrency(analytics.revenueThisMonth)}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Avg. order value</p>
                <p className="font-bold text-text-primary">{formatCurrency(analytics.avgOrderValue)}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Orders / customer</p>
                <p className="font-bold text-text-primary">{analytics.ordersPerCustomer}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Orders (30d)</p>
                <p className="font-bold text-text-primary">{analytics.ordersThisMonth}</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-[16px] bg-surface border border-border p-6 flex flex-col">
          <div
            className="mb-6 pb-3"
            style={{ borderBottom: '2px solid var(--color-primary)' }}
          >
            <h3 className="font-bold text-text-primary">Quick Actions</h3>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            <Link
              href="/admin/products/new"
              className="flex items-center gap-3 rounded-[12px] p-4 bg-bg border border-border transition-all duration-200 hover:-translate-y-0.5 min-h-[48px]"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }}
              >
                <PlusIcon className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Add Product</p>
                <p className="text-xs text-text-secondary">Create a new listing</p>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-text-secondary ml-auto" />
            </Link>

            <Link
              href="/admin/orders?status=pending"
              className="flex items-center gap-3 rounded-[12px] p-4 bg-bg border border-border transition-all duration-200 hover:-translate-y-0.5 min-h-[48px]"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)' }}
              >
                <ClipboardListIcon className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Pending Orders</p>
                <p className="text-xs text-text-secondary">Review awaiting orders</p>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-text-secondary ml-auto" />
            </Link>

            <Link
              href="/admin/translations"
              className="flex items-center gap-3 rounded-[12px] p-4 bg-bg border border-border transition-all duration-200 hover:-translate-y-0.5 min-h-[48px]"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)' }}
              >
                <LanguageIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Manage Translations</p>
                <p className="text-xs text-text-secondary">Edit language content</p>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-text-secondary ml-auto" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Reports + Low Stock ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[16px] bg-surface border border-border p-6">
          <h3 className="font-bold text-text-primary mb-4">Export Reports</h3>
          <p className="text-sm text-text-secondary mb-4">Download CSV reports for accounting and analysis.</p>
          <div className="flex flex-wrap gap-3">
            {[
              { type: 'sales', label: 'Sales Report' },
              { type: 'products', label: 'Products Report' },
              { type: 'customers', label: 'Customers Report' },
            ].map((report) => (
              <a
                key={report.type}
                href={`/api/v1/admin/reports?type=${report.type}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-border bg-bg text-sm font-semibold text-text-primary hover:border-primary hover:text-primary transition-colors min-h-[48px]"
              >
                <ChartBarIcon className="w-4 h-4" />
                {report.label}
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-[16px] bg-surface border border-border p-6">
          <h3 className="font-bold text-text-primary mb-4">Low Stock Alerts</h3>
          {!analytics ? (
            <p className="text-sm text-text-secondary">Loading…</p>
          ) : analytics.lowStockProducts.length === 0 ? (
            <p className="text-sm text-text-secondary">All products are well stocked.</p>
          ) : (
            <ul className="space-y-2">
              {analytics.lowStockProducts.slice(0, 5).map((product) => (
                <li key={product.id} className="flex items-center justify-between text-sm">
                  <span className="text-text-primary truncate pr-3">{product.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${
                      product.stock === 0 ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'
                    }`}
                  >
                    {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Recent Orders Table ── */}
      <div className="rounded-[16px] bg-surface border border-border overflow-hidden">
        <div
          className="p-5 flex items-center justify-between"
          style={{ borderBottom: '2px solid var(--color-primary)' }}
        >
          <h3 className="font-bold text-text-primary">Recent Orders</h3>
          <Link
            href="/admin/orders"
            className="text-sm font-semibold min-h-[48px] min-w-[48px] inline-flex items-center px-3 py-2 rounded-xl transition-colors hover:bg-primary/10"
            style={{ color: 'var(--color-primary)' }}
          >
            View all →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Order #', 'Items', 'Total', 'Status', 'Date'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 font-semibold bg-primary-dark text-primary"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordersLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-text-secondary">
                    Loading recent orders…
                  </td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-text-secondary">
                    No orders found.
                  </td>
                </tr>
              ) : (
                recentOrders.slice(0, 10).map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border transition-colors hover:bg-bg/50"
                  >
                    <td className="px-5 py-4 font-semibold text-text-primary">
                      #{order.orderNumber}
                    </td>
                    <td className="px-5 py-4 text-text-secondary">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-5 py-4 font-bold text-text-primary">
                      Rs {order.total.toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
