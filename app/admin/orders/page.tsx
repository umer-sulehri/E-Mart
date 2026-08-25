'use client';

import { useState } from 'react';
import {
  Search,
  Eye,
  RotateCcw,
  XCircle,
  ShoppingCart,
  Clock,
  Truck,
  CheckCircle2,
  CreditCard,
  Download,
  Package,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

type OrderStatusType = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const mockOrders = Array.from({ length: 50 }, (_, i) => ({
  id: `EM-2026-${String(4560 - i).padStart(4, '0')}`,
  customer: ['Ahmed Khan', 'Fatima Malik', 'Ali Butt', 'Sara Qureshi', 'Hassan Siddiqui'][i % 5],
  seller: ['Fresh Valley Farms', 'Organic Basket', 'Karachi Meats', 'Green Grocery', 'Dairy Direct'][i % 5],
  itemsCount: Math.floor(Math.random() * 8) + 1,
  total: Math.floor(Math.random() * 15000) + 200,
  paymentMethod: ['cod', 'easypaisa', 'jazzcash', 'stripe'][i % 4] as string,
  status: (['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const)[i % 6],
  date: new Date(2026, 7, Math.max(1, 25 - Math.floor(i / 3))).toISOString(),
}));

const statusConfig: Record<OrderStatusType, { variant: 'warning' | 'primary' | 'secondary' | 'outline' | 'success' | 'danger'; icon: React.ElementType }> = {
  pending: { variant: 'warning', icon: Clock },
  confirmed: { variant: 'primary', icon: CheckCircle2 },
  processing: { variant: 'secondary', icon: Package },
  shipped: { variant: 'outline', icon: Truck },
  delivered: { variant: 'success', icon: CheckCircle2 },
  cancelled: { variant: 'danger', icon: XCircle },
};

const paymentIcons: Record<string, React.ElementType> = {
  cod: CreditCard,
  easypaisa: CreditCard,
  jazzcash: CreditCard,
  stripe: CreditCard,
};

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filtered = mockOrders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.seller.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedOrders = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalOrders = mockOrders.length;
  const pendingCount = mockOrders.filter((o) => o.status === 'pending').length;
  const processingCount = mockOrders.filter((o) => o.status === 'processing').length;
  const shippedCount = mockOrders.filter((o) => o.status === 'shipped').length;
  const deliveredCount = mockOrders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = mockOrders.filter((o) => o.status === 'cancelled').length;

  const toggleSelect = (id: string) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Orders Management</h1>
          <p className="text-sm text-muted-500">Track and manage all marketplace orders</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <p className="mt-2 text-2xl font-bold text-secondary-800">{totalOrders}</p>
          <p className="text-xs text-muted-500">Total</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
            <Clock className="h-5 w-5" />
          </div>
          <p className="mt-2 text-2xl font-bold text-secondary-800">{pendingCount}</p>
          <p className="text-xs text-muted-500">Pending</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-100 text-secondary-600">
            <Package className="h-5 w-5" />
          </div>
          <p className="mt-2 text-2xl font-bold text-secondary-800">{processingCount}</p>
          <p className="text-xs text-muted-500">Processing</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Truck className="h-5 w-5" />
          </div>
          <p className="mt-2 text-2xl font-bold text-secondary-800">{shippedCount}</p>
          <p className="text-xs text-muted-500">Shipped</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 text-success-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="mt-2 text-2xl font-bold text-secondary-800">{deliveredCount}</p>
          <p className="text-xs text-muted-500">Delivered</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-100 text-danger-600">
            <XCircle className="h-5 w-5" />
          </div>
          <p className="mt-2 text-2xl font-bold text-secondary-800">{cancelledCount}</p>
          <p className="text-xs text-muted-500">Cancelled</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer, seller..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-lg border border-muted-200 bg-white py-2 pl-10 pr-4 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-700 focus:border-primary focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              className="rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-700 focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {selectedOrders.length > 0 && (
          <div className="mt-3 flex items-center gap-3 rounded-lg bg-primary-50 px-4 py-2">
            <span className="text-sm text-primary-700">{selectedOrders.length} orders selected</span>
            <Button variant="primary" size="sm">Mark as Processing</Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedOrders([])}>Clear</Button>
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100">
                <th className="pb-3 pr-4">
                  <input type="checkbox" className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary" />
                </th>
                <th className="pb-3 font-medium text-muted-500">Order ID</th>
                <th className="hidden pb-3 font-medium text-muted-500 md:table-cell">Customer</th>
                <th className="hidden pb-3 font-medium text-muted-500 lg:table-cell">Seller</th>
                <th className="hidden pb-3 font-medium text-muted-500 md:table-cell">Items</th>
                <th className="pb-3 font-medium text-muted-500">Total</th>
                <th className="hidden pb-3 font-medium text-muted-500 lg:table-cell">Payment</th>
                <th className="pb-3 font-medium text-muted-500">Status</th>
                <th className="hidden pb-3 font-medium text-muted-500 lg:table-cell">Date</th>
                <th className="pb-3 font-medium text-muted-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-50">
              {paginatedOrders.map((order) => {
                const cfg = statusConfig[order.status as OrderStatusType];
                return (
                  <tr key={order.id} className="hover:bg-muted-50/50">
                    <td className="py-3 pr-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="py-3 font-medium text-primary">{order.id}</td>
                    <td className="hidden py-3 text-secondary-800 md:table-cell">{order.customer}</td>
                    <td className="hidden py-3 text-muted-600 lg:table-cell">{order.seller}</td>
                    <td className="hidden py-3 text-secondary-800 md:table-cell">{order.itemsCount}</td>
                    <td className="py-3 font-medium text-secondary-800">₨{order.total.toLocaleString()}</td>
                    <td className="hidden py-3 lg:table-cell">
                      <span className="inline-flex items-center gap-1 capitalize text-muted-600">
                        <CreditCard className="h-3.5 w-3.5" />
                        {order.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge variant={cfg.variant} size="sm">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="hidden whitespace-nowrap py-3 text-muted-600 lg:table-cell">
                      {new Date(order.date).toLocaleDateString('en-PK')}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button className="rounded p-1.5 text-muted-500 transition-colors hover:bg-muted-100 hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="rounded p-1.5 text-muted-500 transition-colors hover:bg-warning-50 hover:text-warning">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button className="rounded p-1.5 text-muted-500 transition-colors hover:bg-danger-50 hover:text-danger">
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-muted-200 p-2 text-muted-600 transition-colors hover:bg-muted-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                    currentPage === page
                      ? 'bg-primary text-white'
                      : 'border border-muted-200 text-muted-600 hover:bg-muted-50'
                  )}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-muted-200 p-2 text-muted-600 transition-colors hover:bg-muted-50 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
