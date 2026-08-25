'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Truck, Package } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatPrice, formatDate, cn } from '@/lib/utils';

type FilterStatus = 'all' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const tabs: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

interface OrderItem {
  name: string;
  image: string;
}

interface MockOrder {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  items: OrderItem[];
  total: number;
}

const mockOrders: MockOrder[] = [
  {
    id: 'EM-2026-10482',
    orderNumber: 'EM-2026-10482',
    date: '2026-08-20',
    status: 'delivered',
    items: [
      { name: 'Organic Bananas', image: '/images/products/banana.jpg' },
      { name: 'Fresh Milk 1L', image: '/images/products/milk.jpg' },
      { name: 'Brown Eggs 12pc', image: '/images/products/eggs.jpg' },
    ],
    total: 4850,
  },
  {
    id: 'EM-2026-10471',
    orderNumber: 'EM-2026-10471',
    date: '2026-08-18',
    status: 'shipped',
    items: [
      { name: 'Chicken Breast 1kg', image: '/images/products/chicken.jpg' },
      { name: 'Basmati Rice 5kg', image: '/images/products/rice.jpg' },
      { name: 'Olive Oil 500ml', image: '/images/products/oil.jpg' },
    ],
    total: 8920,
  },
  {
    id: 'EM-2026-10459',
    orderNumber: 'EM-2026-10459',
    date: '2026-08-15',
    status: 'processing',
    items: [
      { name: 'Greek Yogurt 500g', image: '/images/products/yogurt.jpg' },
      { name: 'Multigrain Bread', image: '/images/products/bread.jpg' },
    ],
    total: 3200,
  },
  {
    id: 'EM-2026-10445',
    orderNumber: 'EM-2026-10445',
    date: '2026-08-12',
    status: 'delivered',
    items: [
      { name: 'Atlantic Salmon 500g', image: '/images/products/salmon.jpg' },
      { name: 'Avocados 4pc', image: '/images/products/avocado.jpg' },
      { name: 'Baby Spinach 250g', image: '/images/products/spinach.jpg' },
    ],
    total: 12340,
  },
  {
    id: 'EM-2026-10430',
    orderNumber: 'EM-2026-10430',
    date: '2026-08-08',
    status: 'cancelled',
    items: [
      { name: 'Protein Bar Pack', image: '/images/products/protein-bar.jpg' },
      { name: 'Almond Milk 1L', image: '/images/products/almond-milk.jpg' },
    ],
    total: 1950,
  },
  {
    id: 'EM-2026-10418',
    orderNumber: 'EM-2026-10418',
    date: '2026-08-05',
    status: 'delivered',
    items: [
      { name: 'Mangoes 3kg', image: '/images/products/mango.jpg' },
      { name: 'Tomato Ketchup', image: '/images/products/ketchup.jpg' },
      { name: 'Pasta Penne 500g', image: '/images/products/pasta.jpg' },
    ],
    total: 5670,
  },
  {
    id: 'EM-2026-10405',
    orderNumber: 'EM-2026-10405',
    date: '2026-08-01',
    status: 'shipped',
    items: [
      { name: 'Walnuts 250g', image: '/images/products/walnuts.jpg' },
      { name: 'Green Tea 25 bags', image: '/images/products/green-tea.jpg' },
    ],
    total: 2840,
  },
  {
    id: 'EM-2026-10392',
    orderNumber: 'EM-2026-10392',
    date: '2026-07-28',
    status: 'processing',
    items: [
      { name: 'Canned Tuna 400g', image: '/images/products/tuna.jpg' },
      { name: 'Quinoa 500g', image: '/images/products/quinoa.jpg' },
      { name: 'Honey 500ml', image: '/images/products/honey.jpg' },
    ],
    total: 6190,
  },
];

const statusVariant: Record<string, 'success' | 'warning' | 'primary' | 'danger'> = {
  delivered: 'success',
  processing: 'warning',
  shipped: 'primary',
  cancelled: 'danger',
};

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<FilterStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  const filtered =
    activeTab === 'all'
      ? mockOrders
      : mockOrders.filter((o) => o.status === activeTab);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginatedOrders = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-secondary-800">My Orders</h2>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setCurrentPage(1);
            }}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.value
                ? 'bg-primary text-white'
                : 'text-muted-600 hover:bg-muted-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {paginatedOrders.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-muted-300" />
          <p className="mt-4 text-lg font-semibold text-secondary-800">
            No orders found
          </p>
          <p className="mt-1 text-sm text-muted-500">
            {activeTab === 'all'
              ? "You haven't placed any orders yet."
              : `No ${activeTab} orders.`}
          </p>
          <Link href="/products">
            <Button variant="primary" className="mt-4">
              Start Shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-secondary-800">
                    {order.orderNumber}
                  </p>
                  <p className="text-sm text-muted-500">
                    {formatDate(order.date)}
                  </p>
                </div>
                <Badge variant={statusVariant[order.status]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>

              {/* Product thumbnails */}
              <div className="mt-4 flex items-center gap-2">
                {order.items.slice(0, 3).map((item, i) => (
                  <div
                    key={i}
                    className="relative h-14 w-14 overflow-hidden rounded-lg border border-muted-200 bg-muted-50"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
                {order.items.length > 3 && (
                  <span className="text-sm text-muted-500">
                    +{order.items.length - 3} more
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-muted-100 pt-4">
                <p className="font-bold text-secondary-800">
                  {formatPrice(order.total)}
                </p>
                <div className="flex gap-2">
                  <Link href={`/dashboard/orders/${order.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                  {order.status === 'shipped' && (
                    <Button variant="ghost" size="sm">
                      <Truck className="h-4 w-4" />
                      Track
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                    currentPage === page
                      ? 'bg-primary text-white'
                      : 'text-muted-600 hover:bg-muted-100'
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
