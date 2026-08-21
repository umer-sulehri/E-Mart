'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { useSellerOrders } from '@/hooks/useSeller';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SearchIcon, EyeIcon, OrderIcon } from '@/components/icons';

type FilterStatus = 'all' | string;

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function SellerOrdersPage() {
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const { data: ordersData } = useSellerOrders(currentPage, perPage);
  const allOrders = ordersData?.orders ?? [];

  const orders = useMemo(() => allOrders, [allOrders]);

  const filtered = useMemo(() => {
    return orders
      .filter(o => filter === 'all' || o.status === filter)
      .filter(o =>
        search.trim() === '' ||
        o.orderNumber.toLowerCase().includes(search.toLowerCase())
      );
  }, [orders, filter, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[16px] p-6" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', boxShadow: '0 10px 25px rgba(122,155,118,0.3)' }}>
        <h1 className="text-3xl font-bold text-white mb-1">My Orders</h1>
        <p className="text-white/70">Track and manage your store orders.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: 'var(--color-text-secondary)' }} />
        <input
          type="search"
          placeholder="Search by order number..."
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full h-[48px] pl-11 pr-4 rounded-[10px] text-base focus:outline-none focus:ring-2"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        />
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setCurrentPage(1); }}
            className="h-[40px] px-4 rounded-full text-sm font-semibold transition-all"
            style={{
              background: filter === s ? 'var(--color-primary)' : 'var(--color-surface)',
              color: filter === s ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
              border: `1px solid ${filter === s ? 'var(--color-primary)' : 'var(--color-border)'}`,
            }}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            {statusCounts[s] ? ` (${statusCounts[s]})` : ''}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {filtered.length === 0 ? (
        <div className="rounded-[16px] p-12 text-center" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(122,155,118,0.12)' }}>
            <OrderIcon className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>No orders found</p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {search ? 'Try a different search term.' : 'Orders containing your products will appear here.'}
          </p>
        </div>
      ) : (
        <div className="rounded-[16px] overflow-hidden" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Order #', 'Date', 'Items', 'Total', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left p-4 font-semibold text-sm" style={{ background: 'var(--color-primary-dark)', color: 'var(--color-primary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(order => (
                  <tr key={order.id} className="transition-colors hover:bg-white/50" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="p-4 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      #{order.orderNumber}
                    </td>
                    <td className="p-4 whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {order.items.slice(0, 3).map(item => (
                          <img
                            key={item.id}
                            src={item.productImage}
                            alt={item.productName}
                            className="w-8 h-8 rounded-lg object-cover"
                            title={item.productName}
                          />
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                            +{order.items.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-semibold whitespace-nowrap" style={{ color: 'var(--color-text-primary)' }}>
                      Rs {order.total.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/user/orders/${order.id}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/60"
                        title="View order"
                      >
                        <EyeIcon className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40"
                  style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-primary)' }}
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: 'var(--color-primary)' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
