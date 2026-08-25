'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Eye, ChevronLeft, ChevronRight, Package, RefreshCw } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

type OrderTab = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface SellerOrder {
  id: string;
  orderNumber: string;
  customer: string;
  itemCount: number;
  total: number;
  status: string;
  date: string;
  items: { name: string; image: string; qty: number }[];
}

const tabs: { key: OrderTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const mockOrders: SellerOrder[] = [
  { id: '1', orderNumber: 'EM-2026-10482', customer: 'Ahmed Khan', itemCount: 3, total: 4850, status: 'delivered', date: '2026-08-20', items: [{ name: 'Rice 5kg', image: '/images/products/rice.jpg', qty: 1 }, { name: 'Milk 1L', image: '/images/products/milk.jpg', qty: 2 }] },
  { id: '2', orderNumber: 'EM-2026-10471', customer: 'Fatima Ali', itemCount: 5, total: 8920, status: 'shipped', date: '2026-08-18', items: [{ name: 'Olive Oil', image: '/images/products/olive-oil.jpg', qty: 1 }, { name: 'Chicken', image: '/images/products/chicken.jpg', qty: 2 }] },
  { id: '3', orderNumber: 'EM-2026-10459', customer: 'Hassan Raza', itemCount: 2, total: 3200, status: 'processing', date: '2026-08-15', items: [{ name: 'Mangoes 1kg', image: '/images/products/mango.jpg', qty: 2 }] },
  { id: '4', orderNumber: 'EM-2026-10445', customer: 'Sara Malik', itemCount: 7, total: 12340, status: 'delivered', date: '2026-08-12', items: [{ name: 'Eggs', image: '/images/products/eggs.jpg', qty: 3 }] },
  { id: '5', orderNumber: 'EM-2026-10430', customer: 'Usman Tariq', itemCount: 1, total: 1950, status: 'cancelled', date: '2026-08-08', items: [{ name: 'Bread', image: '/images/products/bread.jpg', qty: 1 }] },
  { id: '6', orderNumber: 'EM-2026-10428', customer: 'Ayesha Noor', itemCount: 4, total: 5680, status: 'pending', date: '2026-08-21', items: [{ name: 'Salmon', image: '/images/products/salmon.jpg', qty: 1 }] },
  { id: '7', orderNumber: 'EM-2026-10425', customer: 'Bilal Shah', itemCount: 2, total: 2100, status: 'shipped', date: '2026-08-19', items: [{ name: 'Green Tea', image: '/images/products/tea.jpg', qty: 2 }] },
  { id: '8', orderNumber: 'EM-2026-10420', customer: 'Zainab Hussain', itemCount: 3, total: 4350, status: 'processing', date: '2026-08-17', items: [{ name: 'Formula', image: '/images/products/formula.jpg', qty: 1 }] },
  { id: '9', orderNumber: 'EM-2026-10418', customer: 'Omar Farooq', itemCount: 6, total: 9720, status: 'delivered', date: '2026-08-14', items: [{ name: 'Chips', image: '/images/products/chips.jpg', qty: 3 }] },
  { id: '10', orderNumber: 'EM-2026-10415', customer: 'Hira Siddiqui', itemCount: 1, total: 890, status: 'pending', date: '2026-08-22', items: [{ name: 'Vitamins', image: '/images/products/vitamins.jpg', qty: 1 }] },
  { id: '11', orderNumber: 'EM-2026-10412', customer: 'Kamran Akmal', itemCount: 2, total: 2640, status: 'shipped', date: '2026-08-16', items: [{ name: 'Cat Food', image: '/images/products/cat-food.jpg', qty: 2 }] },
  { id: '12', orderNumber: 'EM-2026-10410', customer: 'Nadia Iqbal', itemCount: 4, total: 5100, status: 'delivered', date: '2026-08-13', items: [{ name: 'Dishwash', image: '/images/products/dishwash.jpg', qty: 2 }] },
  { id: '13', orderNumber: 'EM-2026-10408', customer: 'Saad Butt', itemCount: 3, total: 3900, status: 'processing', date: '2026-08-20', items: [{ name: 'Orange Juice', image: '/images/products/orange-juice.jpg', qty: 3 }] },
  { id: '14', orderNumber: 'EM-2026-10405', customer: 'Mehwish Hayat', itemCount: 2, total: 2380, status: 'pending', date: '2026-08-23', items: [{ name: 'Rice 5kg', image: '/images/products/rice.jpg', qty: 1 }] },
  { id: '15', orderNumber: 'EM-2026-10402', customer: 'Imran Abbas', itemCount: 5, total: 7650, status: 'delivered', date: '2026-08-10', items: [{ name: 'Milk 1L', image: '/images/products/milk.jpg', qty: 5 }] },
  { id: '16', orderNumber: 'EM-2026-10400', customer: 'Sana Javed', itemCount: 1, total: 1199, status: 'cancelled', date: '2026-08-07', items: [{ name: 'Mangoes', image: '/images/products/mango.jpg', qty: 1 }] },
  { id: '17', orderNumber: 'EM-2026-10398', customer: 'Fawad Khan', itemCount: 3, total: 4500, status: 'shipped', date: '2026-08-21', items: [{ name: 'Olive Oil', image: '/images/products/olive-oil.jpg', qty: 2 }] },
  { id: '18', orderNumber: 'EM-2026-10395', customer: 'Mahira Khan', itemCount: 4, total: 6200, status: 'delivered', date: '2026-08-09', items: [{ name: 'Chicken', image: '/images/products/chicken.jpg', qty: 3 }] },
  { id: '19', orderNumber: 'EM-2026-10392', customer: 'Atif Aslam', itemCount: 2, total: 1680, status: 'processing', date: '2026-08-22', items: [{ name: 'Bread', image: '/images/products/bread.jpg', qty: 4 }] },
  { id: '20', orderNumber: 'EM-2026-10390', customer: 'Yumna Zaidi', itemCount: 6, total: 10400, status: 'pending', date: '2026-08-24', items: [{ name: 'Eggs', image: '/images/products/eggs.jpg', qty: 6 }] },
];

const statusVariant: Record<string, 'success' | 'warning' | 'primary' | 'danger' | 'default'> = {
  delivered: 'success',
  processing: 'warning',
  shipped: 'primary',
  cancelled: 'danger',
  pending: 'default',
};

const ITEMS_PER_PAGE = 8;

export default function SellerOrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderTab>('all');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = mockOrders.filter((o) => activeTab === 'all' || o.status === activeTab);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const tabCounts = {
    all: mockOrders.length,
    pending: mockOrders.filter((o) => o.status === 'pending').length,
    processing: mockOrders.filter((o) => o.status === 'processing').length,
    shipped: mockOrders.filter((o) => o.status === 'shipped').length,
    delivered: mockOrders.filter((o) => o.status === 'delivered').length,
    cancelled: mockOrders.filter((o) => o.status === 'cancelled').length,
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    setTimeout(() => {
      alert(`Order ${orderId} status updated to ${newStatus}`);
      setUpdatingId(null);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-secondary-800">Orders</h2>
        <p className="text-sm text-muted-500">Manage and fulfill customer orders</p>
      </div>

      {/* Tabs */}
      <div className="rounded-xl bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary text-white'
                  : 'text-muted-600 hover:bg-muted-50'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 rounded-full px-1.5 text-xs ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-muted-100'
              }`}>
                {tabCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm">
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
                <th className="px-6 py-3 font-medium text-muted-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="mx-auto mb-3 h-10 w-10 text-muted-300" />
                    <p className="text-sm text-muted-500">No orders found</p>
                  </td>
                </tr>
              ) : (
                paginated.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-muted-50 transition-colors hover:bg-muted-50/50"
                  >
                    <td className="px-6 py-4 font-medium text-secondary-800">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-muted-600">{order.customer}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {order.items.slice(0, 3).map((item, i) => (
                            <div
                              key={i}
                              className="h-7 w-7 overflow-hidden rounded-full border-2 border-white bg-muted-100"
                            >
                              <Image src={item.image} alt={item.name} width={48} height={48} className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                        <span className="text-muted-600">{order.itemCount} items</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-secondary-800">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant[order.status]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-600">{formatDate(order.date)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="rounded-lg p-2 text-muted-600 transition-colors hover:bg-primary-50 hover:text-primary" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          disabled={updatingId === order.id}
                          className="rounded-lg border border-muted-200 bg-white px-2 py-1.5 text-xs text-secondary-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-muted-100 px-6 py-4">
            <p className="text-sm text-muted-500">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} orders
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-muted-200 p-2 text-muted-600 transition-colors hover:bg-muted-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-primary text-white'
                      : 'text-muted-600 hover:bg-muted-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-muted-200 p-2 text-muted-600 transition-colors hover:bg-muted-50 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
