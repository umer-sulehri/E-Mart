'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useOrders } from '@/hooks/useOrders';
import { OrderStatus } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { OrderIcon, TruckIcon } from '@/components/icons';

type FilterStatus = 'all' | OrderStatus;

export default function UserOrdersPage() {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;
  const { data, isLoading, isError } = useOrders(currentPage, perPage);

  const orders = data?.orders ?? [];
  const totalCount = data?.total ?? 0;

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">My Orders</h1>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as FilterStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`h-[40px] px-4 rounded-full text-sm font-semibold transition-colors ${
              filter === s
                ? 'bg-primary text-text-inverse'
                : 'bg-surface text-text-secondary hover:bg-surface-alt border border-border'
            }`}
          >
            {s === 'all' ? 'All Orders' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-alt rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 bg-surface-alt rounded w-32" />
                    <div className="h-3 bg-surface-alt rounded w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-surface-alt rounded w-20" />
                  <div className="h-5 bg-surface-alt rounded w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16">
          <p className="text-lg text-error mb-2">Failed to load orders</p>
          <p className="text-sm text-text-secondary">Please try again later.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <OrderIcon className="w-16 h-16 text-text-secondary mx-auto mb-4" />
          <p className="text-lg text-text-secondary">No orders found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((order) => (
            <Link key={order.id} href={`/user/orders/${order.id}`}>
              <Card className="p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center flex-shrink-0">
                      <TruckIcon className="w-6 h-6 text-primary-dark" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-text-primary">#{order.orderNumber}</p>
                      <p className="text-xs text-text-secondary mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                    <StatusBadge status={order.status} />
                    <span className="text-lg font-bold text-text-primary">Rs {order.total.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-text-secondary">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-[40px] px-4 rounded-full text-sm font-semibold bg-surface border border-border text-text-secondary hover:bg-surface-alt disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-[40px] px-4 rounded-full text-sm font-semibold bg-primary text-text-inverse hover:bg-primary-hover disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

