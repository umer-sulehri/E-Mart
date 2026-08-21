'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAdminOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { OrderStatus } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SearchIcon, EyeIcon } from '@/components/icons';

type FilterStatus = 'all' | OrderStatus;

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAGE_SIZE = 10;

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openStatusRow, setOpenStatusRow] = useState<string | null>(null);

  const { data, isLoading, isError } = useAdminOrders();
  const updateStatus = useUpdateOrderStatus();

  const filtered = useMemo(() => (data?.orders ?? [])
    .filter((o) => filter === 'all' || o.status === filter)
    .filter((o) => search.trim() === '' || o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.address?.toLowerCase().includes(search.toLowerCase())),
    [data, filter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleStatusChange = (id: string, status: OrderStatus) => {
    updateStatus.mutate({ id, status });
    setOpenStatusRow(null);
  };

  const parseAddress = (address: string) => {
    const parts = address.split(',').map((p) => p.trim());
    return parts[0] || '—';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Manage Orders</h1>

      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by order number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-[12px] bg-surface-alt border border-border text-text-primary text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </Card>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', ...STATUS_OPTIONS] as FilterStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`h-[40px] px-4 rounded-full text-sm font-semibold transition-colors ${
              filter === s
                ? 'bg-primary text-text-inverse'
                : 'bg-surface text-text-secondary hover:bg-surface-alt border border-border'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-4 bg-surface-alt rounded w-24" />
                <div className="h-4 bg-surface-alt rounded w-20" />
                <div className="h-4 bg-surface-alt rounded w-16" />
                <div className="h-4 bg-surface-alt rounded w-20" />
                <div className="h-4 bg-surface-alt rounded w-24" />
                <div className="h-4 bg-surface-alt rounded w-20" />
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
          <p className="text-lg text-text-secondary">No orders found</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-primary text-primary text-left">
                  <th className="px-4 py-3 font-semibold">Order #</th>
                  <th className="px-4 py-3 font-semibold">Buyer</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-surface-alt/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">
                      #{order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {parseAddress(order.address)}
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      {order.items.length}
                    </td>
                    <td className="px-4 py-3 font-semibold text-text-primary whitespace-nowrap">
                      Rs {order.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* Status Update Toggle */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenStatusRow(
                                openStatusRow === order.id ? null : order.id,
                              )
                            }
                            className="h-[48px] min-w-[48px] px-3 rounded-[12px] bg-surface-alt border border-border text-xs font-semibold text-text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5"
                          >
                            Update
                          </button>
                          {openStatusRow === order.id && (
                            <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-surface border border-border rounded-[12px] shadow-lg py-1">
                              {STATUS_OPTIONS.map((s) => (
                                <button
                                  key={s}
                                  onClick={() =>
                                    handleStatusChange(order.id, s)
                                  }
                                  className={`w-full text-left px-4 py-3 min-h-[48px] text-sm transition-colors ${
                                    order.status === s
                                      ? 'bg-primary/10 text-primary font-semibold'
                                      : 'text-text-primary hover:bg-surface-alt'
                                  }`}
                                >
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* View Detail */}
                        <Link
                          href={`/user/orders/${order.id}`}
                          className="h-[48px] min-w-[48px] px-3 rounded-[12px] bg-surface-alt border border-border text-text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                          title="View order"
                        >
                          <EyeIcon className="w-4 h-4" />
                          <span className="hidden sm:inline">View</span>
                        </Link>

                        {/* Print */}
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="h-[48px] min-w-[48px] px-3 rounded-[12px] bg-surface-alt border border-border text-text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                          title="Print order"
                        >
                          🖨
                          <span className="hidden sm:inline">Print</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-text-secondary">
            Page {page} of {totalPages} ({filtered.length} orders)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-[40px] px-4 rounded-[10px] border border-border bg-surface text-sm font-semibold text-text-primary disabled:opacity-40 hover:bg-surface-alt transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-[40px] w-[40px] rounded-[10px] text-sm font-semibold transition-colors ${
                    page === pageNum ? 'bg-primary text-text-inverse' : 'border border-border bg-surface text-text-primary hover:bg-surface-alt'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-[40px] px-4 rounded-[10px] border border-border bg-surface text-sm font-semibold text-text-primary disabled:opacity-40 hover:bg-surface-alt transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
