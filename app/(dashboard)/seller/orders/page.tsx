'use client';

import { useState, useMemo } from 'react';
import { useSellerOrders, useUpdateSellerOrderStatus, type SellerOrderStatus } from '@/hooks/useSeller';
import { SearchIcon, OrderIcon, CloseIcon, TruckIcon, PackageIcon } from '@/components/icons';
import { useToast } from '@/components/ui/Toast';
import type { Order } from '@/lib/types';

type FilterStatus = 'all' | string;

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const NEXT_STATUS_OPTIONS: Record<string, SellerOrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export default function SellerOrdersPage() {
  const toast = useToast();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const { data: ordersData } = useSellerOrders(currentPage, perPage);
  const updateStatus = useUpdateSellerOrderStatus();
  const [statusError, setStatusError] = useState('');
  const [shipTarget, setShipTarget] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const orders = useMemo(() => ordersData?.orders ?? [], [ordersData]);

  const confirmShip = () => {
    if (!shipTarget) return;
    updateStatus.mutate(
      { id: shipTarget.id, status: 'shipped', trackingNumber: trackingInput.trim() || undefined },
      {
        onSuccess: () => {
          toast.showToast(`Order #${shipTarget.orderNumber} marked as shipped.`, 'success');
          setShipTarget(null);
          setTrackingInput('');
        },
        onError: (err) => setStatusError(err instanceof Error ? err.message : 'Failed to update status.'),
      }
    );
  };

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
      <div className="rounded-[16px] p-6" style={{ background: 'linear-gradient(135deg, #6B4E35, #3B2A1A)', boxShadow: '0 10px 25px rgba(217,176,140,0.3)' }}>
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

      {/* Status update error */}
      {statusError && (
        <div className="rounded-xl p-4 text-sm font-medium" style={{ background: 'rgba(182,92,75,0.12)', color: 'var(--color-error)' }}>
          {statusError}
        </div>
      )}

      {/* Orders Table */}
      {filtered.length === 0 ? (
        <div className="rounded-[16px] p-12 text-center" style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(217,176,140,0.12)' }}>
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
                      {order.trackingNumber && (
                        <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-secondary)' }} title="Tracking number">
                          <TruckIcon className="w-3 h-3 inline mr-1 -mt-0.5" />
                          {order.trackingNumber}
                        </p>
                      )}
                      {NEXT_STATUS_OPTIONS[order.status]?.length ? (
                        <select
                          value={order.status}
                          disabled={updateStatus.isPending}
                          onChange={(e) => {
                            const next = e.target.value as SellerOrderStatus;
                            setStatusError('');
                            if (next === 'shipped') {
                              setShipTarget(order);
                              return;
                            }
                            updateStatus.mutate(
                              { id: order.id, status: next },
                              {
                                onError: (err) =>
                                  setStatusError(err instanceof Error ? err.message : 'Failed to update status.'),
                              }
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2"
                          style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                          aria-label={`Update status for order ${order.orderNumber}`}
                        >
                          <option value={order.status}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</option>
                          {NEXT_STATUS_OPTIONS[order.status].map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: order.status === 'delivered' ? 'rgba(110,139,94,0.15)' : 'rgba(182,92,75,0.15)',
                            color: order.status === 'delivered' ? '#6E8B5E' : '#B65C4B',
                          }}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setViewOrder(order)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/60"
                        title="View order details"
                      >
                        <OrderIcon className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                      </button>
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

      {/* Ship Modal â€” collect tracking number */}
      {shipTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShipTarget(null)}>
          <div className="w-full max-w-md rounded-[16px] p-6" style={{ background: 'var(--color-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Ship Order #{shipTarget.orderNumber}</h3>
              <button onClick={() => setShipTarget(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }} aria-label="Close">
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Add the carrier tracking number so the customer can follow delivery. You can leave it blank and add it later.
            </p>
            <label className="block mb-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Tracking number</label>
            <input
              type="text"
              value={trackingInput}
              onChange={e => setTrackingInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmShip(); } }}
              placeholder="e.g. TCS-123456789"
              maxLength={64}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShipTarget(null); setTrackingInput(''); }} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>Cancel</button>
              <button onClick={confirmShip} disabled={updateStatus.isPending} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #6B4E35, #3B2A1A)' }}>
                {updateStatus.isPending ? 'Savingâ€¦' : 'Mark as Shipped'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setViewOrder(null)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[16px] p-6" style={{ background: 'var(--color-bg)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '2px solid var(--color-primary)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Order #{viewOrder.orderNumber}</h3>
              <button onClick={() => setViewOrder(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)' }} aria-label="Close">
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-5">
              <p style={{ color: 'var(--color-text-secondary)' }}>Date</p>
              <p style={{ color: 'var(--color-text-primary)' }}>{new Date(viewOrder.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              <p style={{ color: 'var(--color-text-secondary)' }}>Status</p>
              <p className="capitalize font-semibold" style={{ color: 'var(--color-text-primary)' }}>{viewOrder.status}</p>
              <p style={{ color: 'var(--color-text-secondary)' }}>Payment</p>
              <p className="uppercase" style={{ color: 'var(--color-text-primary)' }}>{viewOrder.paymentMethod}</p>
              <p style={{ color: 'var(--color-text-secondary)' }}>Deliver to</p>
              <p style={{ color: 'var(--color-text-primary)' }}>{viewOrder.address}</p>
              {viewOrder.trackingNumber && (
                <>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Tracking</p>
                  <p className="font-semibold inline-flex items-center gap-1" style={{ color: 'var(--color-primary-dark)' }}>
                    <TruckIcon className="w-4 h-4" /> {viewOrder.trackingNumber}
                  </p>
                </>
              )}
            </div>
            <h4 className="text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Items in this order</h4>
            <div className="space-y-2">
              {viewOrder.items.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'var(--color-surface)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.productImage} alt={item.productName} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{item.productName}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Qty {item.quantity} Ã— Rs {item.price.toLocaleString()}</p>
                  </div>
                  <PackageIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-border)' }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 pt-3 text-base font-bold" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}>
              <span>Total</span>
              <span>Rs {viewOrder.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


