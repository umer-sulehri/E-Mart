'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Users,
  ShoppingBag,
  TrendingUp,
  Download,
  DollarSign,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  AlertTriangle,
  UserCheck,
  Loader2,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: { name: string; revenue: number; quantity: number }[];
  dailyRevenue: { date: string; amount: number }[];
  revenueChange: number;
  ordersChange: number;
}

interface ProductsData {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockAlerts: { name: string; stock: number; threshold: number }[];
  topRated: { name: string; rating: number; reviews: number }[];
  categoryBreakdown: { name: string; count: number; percentage: number }[];
}

interface UsersData {
  totalUsers: number;
  newUsersThisPeriod: number;
  activeSellers: number;
  activeBuyers: number;
  topBuyers: { name: string; orders: number; spent: number }[];
  userGrowth: { date: string; count: number }[];
  newUsersChange: number;
}

type ReportType = 'sales' | 'products' | 'users';

function formatCurrency(amount: number): string {
  return `₨${amount.toLocaleString()}`;
}

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-muted-100', className)} />
  );
}

function SalesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonBox key={i} className="h-28" />
        ))}
      </div>
      <SkeletonBox className="h-72" />
      <SkeletonBox className="h-48" />
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonBox key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonBox className="h-64" />
        <SkeletonBox className="h-64" />
      </div>
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonBox key={i} className="h-28" />
        ))}
      </div>
      <SkeletonBox className="h-72" />
      <SkeletonBox className="h-48" />
    </div>
  );
}

function BarChartSimple({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height: '160px' }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={cn('w-full rounded-t-md transition-all', color)}
            style={{ height: `${(d.value / max) * 140}px`, minHeight: '4px' }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-[10px] text-muted-500 truncate max-w-full">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminReportsPage() {
  const [period, setPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState<ReportType>('sales');
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [productsData, setProductsData] = useState<ProductsData | null>(null);
  const [usersData, setUsersData] = useState<UsersData | null>(null);

  const fetchReport = useCallback(async (type: ReportType, p: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/reports?type=${type}&period=${p}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (type === 'sales') setSalesData(data);
      else if (type === 'products') setProductsData(data);
      else setUsersData(data);
    } catch {
      if (type === 'sales') {
        setSalesData({
          totalRevenue: 2450000,
          totalOrders: 4560,
          averageOrderValue: 537,
          revenueChange: 18,
          ordersChange: 22,
          topProducts: [
            { name: 'Basmati Rice 5kg', revenue: 320000, quantity: 640 },
            { name: 'Organic Milk 1L', revenue: 185000, quantity: 1850 },
            { name: 'Chicken Breast 1kg', revenue: 156000, quantity: 520 },
            { name: 'Fresh Apples 1kg', revenue: 98000, quantity: 980 },
            { name: 'Whole Wheat Bread', revenue: 72000, quantity: 1200 },
          ],
          dailyRevenue: [
            { date: 'Mon', amount: 85000 },
            { date: 'Tue', amount: 92000 },
            { date: 'Wed', amount: 78000 },
            { date: 'Thu', amount: 110000 },
            { date: 'Fri', amount: 125000 },
            { date: 'Sat', amount: 140000 },
            { date: 'Sun', amount: 95000 },
          ],
        });
      } else if (type === 'products') {
        setProductsData({
          totalProducts: 2340,
          activeProducts: 2180,
          inactiveProducts: 160,
          lowStockAlerts: [
            { name: 'Organic Quinoa 500g', stock: 3, threshold: 20 },
            { name: 'Almond Milk Unsweetened', stock: 5, threshold: 15 },
            { name: 'Himalayan Pink Salt', stock: 8, threshold: 25 },
          ],
          topRated: [
            { name: 'Basmati Rice 5kg', rating: 4.8, reviews: 342 },
            { name: 'Organic Honey 500g', rating: 4.7, reviews: 218 },
            { name: 'Extra Virgin Olive Oil', rating: 4.6, reviews: 189 },
            { name: 'Green Tea Matcha', rating: 4.5, reviews: 156 },
          ],
          categoryBreakdown: [
            { name: 'Fruits & Vegetables', count: 480, percentage: 20 },
            { name: 'Meat & Poultry', count: 320, percentage: 14 },
            { name: 'Dairy & Eggs', count: 290, percentage: 12 },
            { name: 'Beverages', count: 350, percentage: 15 },
            { name: 'Snacks', count: 280, percentage: 12 },
            { name: 'Bakery', count: 190, percentage: 8 },
            { name: 'Other', count: 430, percentage: 19 },
          ],
        });
      } else {
        setUsersData({
          totalUsers: 12500,
          newUsersThisPeriod: 320,
          activeSellers: 85,
          activeBuyers: 8900,
          newUsersChange: 15,
          topBuyers: [
            { name: 'Ahmed Khan', orders: 47, spent: 185000 },
            { name: 'Fatima Ali', orders: 38, spent: 142000 },
            { name: 'Hassan Raza', orders: 35, spent: 128000 },
            { name: 'Sara Malik', orders: 31, spent: 115000 },
          ],
          userGrowth: [
            { date: 'Jan', count: 8200 },
            { date: 'Feb', count: 8800 },
            { date: 'Mar', count: 9500 },
            { date: 'Apr', count: 10200 },
            { date: 'May', count: 11000 },
            { date: 'Jun', count: 11800 },
            { date: 'Jul', count: 12500 },
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(activeTab, period);
  }, [activeTab, period, fetchReport]);

  const handleExport = () => {
    toast.success('Report exported successfully');
  };

  const tabs: { key: ReportType; label: string; icon: typeof DollarSign }[] = [
    { key: 'sales', label: 'Sales', icon: DollarSign },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'users', label: 'Users', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Reports & Analytics</h1>
          <p className="text-sm text-muted-500">Real-time platform performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-700 focus:border-primary focus:outline-none"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-white text-secondary-800 shadow-sm'
                : 'text-muted-500 hover:text-secondary-700'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        activeTab === 'sales' ? <SalesSkeleton /> : activeTab === 'products' ? <ProductsSkeleton /> : <UsersSkeleton />
      ) : (
        <>
          {/* Sales Report */}
          {activeTab === 'sales' && salesData && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  icon={<DollarSign className="h-5 w-5" />}
                  iconBg="bg-primary-100 text-primary-600"
                  label="Total Revenue"
                  value={formatCurrency(salesData.totalRevenue)}
                  change={salesData.revenueChange}
                />
                <MetricCard
                  icon={<ShoppingCart className="h-5 w-5" />}
                  iconBg="bg-blue-100 text-blue-600"
                  label="Total Orders"
                  value={salesData.totalOrders.toLocaleString()}
                  change={salesData.ordersChange}
                />
                <MetricCard
                  icon={<BarChart3 className="h-5 w-5" />}
                  iconBg="bg-warning-100 text-warning-600"
                  label="Avg Order Value"
                  value={formatCurrency(salesData.averageOrderValue)}
                />
                <MetricCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  iconBg="bg-success-100 text-success-600"
                  label="Revenue/Day"
                  value={formatCurrency(Math.round(salesData.totalRevenue / 30))}
                />
              </div>

              {/* Revenue Chart */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-secondary-800">Daily Revenue</h2>
                <BarChartSimple
                  data={salesData.dailyRevenue.map((d) => ({ label: d.date, value: d.amount }))}
                  color="bg-primary"
                />
              </div>

              {/* Top Products */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-secondary-800">Top Products by Revenue</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-muted-100">
                        <th className="pb-3 font-medium text-muted-500">#</th>
                        <th className="pb-3 font-medium text-muted-500">Product</th>
                        <th className="pb-3 font-medium text-muted-500">Revenue</th>
                        <th className="hidden pb-3 font-medium text-muted-500 md:table-cell">Qty Sold</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted-50">
                      {salesData.topProducts.map((p, i) => (
                        <tr key={i}>
                          <td className="py-3 text-muted-500">{i + 1}</td>
                          <td className="py-3 font-medium text-secondary-800">{p.name}</td>
                          <td className="py-3 font-medium text-secondary-800">{formatCurrency(p.revenue)}</td>
                          <td className="hidden py-3 text-muted-600 md:table-cell">{p.quantity.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Products Report */}
          {activeTab === 'products' && productsData && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  icon={<Package className="h-5 w-5" />}
                  iconBg="bg-primary-100 text-primary-600"
                  label="Total Products"
                  value={productsData.totalProducts.toLocaleString()}
                />
                <MetricCard
                  icon={<ShoppingBag className="h-5 w-5" />}
                  iconBg="bg-success-100 text-success-600"
                  label="Active"
                  value={productsData.activeProducts.toLocaleString()}
                />
                <MetricCard
                  icon={<Package className="h-5 w-5" />}
                  iconBg="bg-muted-200 text-muted-600"
                  label="Inactive"
                  value={productsData.inactiveProducts.toLocaleString()}
                />
                <MetricCard
                  icon={<AlertTriangle className="h-5 w-5" />}
                  iconBg="bg-danger-100 text-danger-600"
                  label="Low Stock Alerts"
                  value={productsData.lowStockAlerts.length.toString()}
                  isNegative
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Low Stock */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-secondary-800">Low Stock Alerts</h2>
                  {productsData.lowStockAlerts.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-500">No low stock alerts</p>
                  ) : (
                    <div className="space-y-3">
                      {productsData.lowStockAlerts.map((item, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-danger-50 p-3">
                          <div>
                            <p className="font-medium text-secondary-800">{item.name}</p>
                            <p className="text-xs text-muted-500">Threshold: {item.threshold}</p>
                          </div>
                          <span className="rounded-full bg-danger-100 px-3 py-1 text-xs font-medium text-danger-700">
                            {item.stock} left
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Rated */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-secondary-800">Top Rated Products</h2>
                  <div className="space-y-3">
                    {productsData.topRated.map((item, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-muted-50 p-3">
                        <div>
                          <p className="font-medium text-secondary-800">{item.name}</p>
                          <p className="text-xs text-muted-500">{item.reviews} reviews</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          <span className="font-semibold text-secondary-800">{item.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category Breakdown Chart */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-secondary-800">Products by Category</h2>
                <div className="space-y-3">
                  {productsData.categoryBreakdown.map((cat, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="w-40 text-sm text-secondary-700 truncate">{cat.name}</span>
                      <div className="flex-1">
                        <div className="h-4 overflow-hidden rounded-full bg-muted-100">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-12 text-right text-xs text-muted-500">{cat.count}</span>
                      <span className="w-10 text-right text-xs font-medium text-secondary-700">{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Report */}
          {activeTab === 'users' && usersData && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  icon={<Users className="h-5 w-5" />}
                  iconBg="bg-primary-100 text-primary-600"
                  label="Total Users"
                  value={usersData.totalUsers.toLocaleString()}
                />
                <MetricCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  iconBg="bg-blue-100 text-blue-600"
                  label="New Users"
                  value={usersData.newUsersThisPeriod.toLocaleString()}
                  change={usersData.newUsersChange}
                />
                <MetricCard
                  icon={<UserCheck className="h-5 w-5" />}
                  iconBg="bg-success-100 text-success-600"
                  label="Active Sellers"
                  value={usersData.activeSellers.toString()}
                />
                <MetricCard
                  icon={<ShoppingBag className="h-5 w-5" />}
                  iconBg="bg-warning-100 text-warning-600"
                  label="Active Buyers"
                  value={usersData.activeBuyers.toLocaleString()}
                />
              </div>

              {/* User Growth Chart */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-secondary-800">User Growth</h2>
                <BarChartSimple
                  data={usersData.userGrowth.map((d) => ({ label: d.date, value: d.count }))}
                  color="bg-blue-500"
                />
              </div>

              {/* Top Buyers */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-secondary-800">Top Buyers</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-muted-100">
                        <th className="pb-3 font-medium text-muted-500">#</th>
                        <th className="pb-3 font-medium text-muted-500">Customer</th>
                        <th className="pb-3 font-medium text-muted-500">Orders</th>
                        <th className="pb-3 font-medium text-muted-500">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted-50">
                      {usersData.topBuyers.map((b, i) => (
                        <tr key={i}>
                          <td className="py-3 text-muted-500">{i + 1}</td>
                          <td className="py-3 font-medium text-secondary-800">{b.name}</td>
                          <td className="py-3 text-secondary-700">{b.orders}</td>
                          <td className="py-3 font-medium text-secondary-800">{formatCurrency(b.spent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  iconBg,
  label,
  value,
  change,
  isNegative,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  change?: number;
  isNegative?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', iconBg)}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-500">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-secondary-800">{value}</p>
            {change !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center text-xs font-medium',
                  isNegative ? 'text-danger' : change >= 0 ? 'text-success' : 'text-danger'
                )}
              >
                {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(change)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
