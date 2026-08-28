'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Star,
  Store,
  Clock,
  ShieldCheck,
  UserX,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

type SellerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

interface Seller {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  contact_email: string;
  contact_phone: string | null;
  status: SellerStatus;
  rating: number;
  total_sales: number;
  created_at: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_email: string;
  productCount: number;
}

const statusMap: Record<SellerStatus, { variant: 'warning' | 'success' | 'danger' | 'default'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'danger', label: 'Rejected' },
  suspended: { variant: 'default', label: 'Suspended' },
};

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter });
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/v1/admin/sellers?${params.toString()}`);
      const json = await res.json();
      if (json.success) setSellers(json.data || []);
      else setError(json.error || 'Failed to load sellers');
    } catch {
      setError('Failed to load sellers');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: 'verify' | 'suspend' | 'reject') => {
    setActing(id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/sellers/${id}/${action}`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        await load();
      } else {
        setError(json.error || 'Action failed');
      }
    } catch {
      setError('Action failed');
    } finally {
      setActing(null);
    }
  };

  const total = sellers.length;
  const pendingCount = sellers.filter((s) => s.status === 'pending').length;
  const approvedCount = sellers.filter((s) => s.status === 'approved').length;
  const suspendedCount = sellers.filter((s) => s.status === 'suspended').length;

  const getInitials = (name: string) =>
    name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const stats = [
    { label: 'Total Sellers', value: total, icon: Store, cls: 'bg-primary-100 text-primary-600' },
    { label: 'Pending Approval', value: pendingCount, icon: Clock, cls: 'bg-warning-100 text-warning-600' },
    { label: 'Active', value: approvedCount, icon: ShieldCheck, cls: 'bg-success-100 text-success-600' },
    { label: 'Suspended', value: suspendedCount, icon: UserX, cls: 'bg-danger-100 text-danger-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">Sellers Management</h1>
        <p className="text-sm text-muted-500">Manage sellers and approval workflow</p>
      </div>

      {error && (
        <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', stat.cls)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary-800">{stat.value}</p>
                <p className="text-xs text-muted-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pendingCount > 0 && (
        <div className="rounded-xl border border-warning-200 bg-warning-50 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium text-secondary-800">{pendingCount} sellers pending approval</p>
              <p className="text-sm text-muted-600">Review and approve new seller registrations</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
            <input
              type="text"
              placeholder="Search sellers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-muted-200 bg-white py-2 pl-10 pr-4 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-700 focus:border-primary focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sellers.length === 0 ? (
          <div className="py-16 text-center text-muted-500">No sellers found</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-muted-100">
                  <th className="pb-3 font-medium text-muted-500">Store</th>
                  <th className="hidden pb-3 font-medium text-muted-500 md:table-cell">Owner</th>
                  <th className="pb-3 font-medium text-muted-500">Status</th>
                  <th className="hidden pb-3 font-medium text-muted-500 lg:table-cell">Products</th>
                  <th className="hidden pb-3 font-medium text-muted-500 lg:table-cell">Sales</th>
                  <th className="hidden pb-3 font-medium text-muted-500 xl:table-cell">Rating</th>
                  <th className="pb-3 font-medium text-muted-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted-50">
                {sellers.map((seller) => {
                  const status = statusMap[seller.status];
                  return (
                    <tr key={seller.id} className="hover:bg-muted-50/50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
                            {getInitials(seller.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-secondary-800">{seller.name}</p>
                            <p className="truncate text-xs text-muted-500 md:hidden">{seller.owner_first_name} {seller.owner_last_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden py-3 md:table-cell">
                        <p className="font-medium text-secondary-800">{seller.owner_first_name} {seller.owner_last_name}</p>
                        <p className="text-xs text-muted-500">{seller.contact_email || seller.owner_email}</p>
                      </td>
                      <td className="py-3">
                        <Badge variant={status.variant} size="sm">{status.label}</Badge>
                      </td>
                      <td className="hidden py-3 text-secondary-800 lg:table-cell">{seller.productCount}</td>
                      <td className="hidden py-3 font-medium text-secondary-800 lg:table-cell">
                        {seller.total_sales > 0 ? `₨${seller.total_sales.toLocaleString()}` : '—'}
                      </td>
                      <td className="hidden py-3 xl:table-cell">
                        {seller.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                            <span className="text-secondary-800">{seller.rating}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setExpanded(expanded === seller.id ? null : seller.id)}
                            className="rounded p-1.5 text-muted-500 transition-colors hover:bg-muted-100 hover:text-primary"
                            aria-label="View seller"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {seller.status === 'pending' && (
                            <>
                              <button
                                onClick={() => act(seller.id, 'verify')}
                                disabled={acting === seller.id}
                                className="rounded p-1.5 text-muted-500 transition-colors hover:bg-success-50 hover:text-success disabled:opacity-50"
                                aria-label="Approve"
                              >
                                {acting === seller.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => act(seller.id, 'reject')}
                                disabled={acting === seller.id}
                                className="rounded p-1.5 text-muted-500 transition-colors hover:bg-danger-50 hover:text-danger disabled:opacity-50"
                                aria-label="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {seller.status === 'approved' && (
                            <button
                              onClick={() => act(seller.id, 'suspend')}
                              disabled={acting === seller.id}
                              className="rounded p-1.5 text-muted-500 transition-colors hover:bg-danger-50 hover:text-danger disabled:opacity-50"
                              aria-label="Suspend"
                            >
                              {acting === seller.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                            </button>
                          )}
                          {seller.status === 'suspended' && (
                            <button
                              onClick={() => act(seller.id, 'verify')}
                              disabled={acting === seller.id}
                              className="rounded p-1.5 text-muted-500 transition-colors hover:bg-success-50 hover:text-success disabled:opacity-50"
                              aria-label="Restore"
                            >
                              {acting === seller.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {expanded && (
        <SellerDetail
          seller={sellers.find((s) => s.id === expanded)}
          onClose={() => setExpanded(null)}
          onApprove={() => act(expanded, 'verify')}
          onSuspend={() => act(expanded, 'suspend')}
          onReject={() => act(expanded, 'reject')}
          acting={acting === expanded}
        />
      )}
    </div>
  );
}

function SellerDetail({
  seller,
  onClose,
  onApprove,
  onSuspend,
  onReject,
  acting,
}: {
  seller?: Seller;
  onClose: () => void;
  onApprove: () => void;
  onSuspend: () => void;
  onReject: () => void;
  acting: boolean;
}) {
  if (!seller) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-secondary-800">{seller.name}</h3>
        <p className="text-sm text-muted-500">{seller.description || 'No description'}</p>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-500">Owner</p>
            <p className="text-secondary-800">{seller.owner_first_name} {seller.owner_last_name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-500">Contact</p>
            <p className="text-secondary-800">{seller.contact_email || seller.owner_email}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-500">Phone</p>
            <p className="text-secondary-800">{seller.contact_phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-500">Products</p>
            <p className="text-secondary-800">{seller.productCount}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-500">Sales</p>
            <p className="text-secondary-800">₨{seller.total_sales.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-500">Registered</p>
            <p className="text-secondary-800">
              {new Date(seller.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          {(seller.status === 'pending' || seller.status === 'suspended') && (
            <Button variant="success" size="sm" onClick={onApprove} disabled={acting}>
              <CheckCircle2 className="h-4 w-4" /> {seller.status === 'suspended' ? 'Restore' : 'Approve'}
            </Button>
          )}
          {seller.status === 'approved' && (
            <Button variant="danger" size="sm" onClick={onSuspend} disabled={acting}>
              <UserX className="h-4 w-4" /> Suspend
            </Button>
          )}
          {seller.status === 'pending' && (
            <Button variant="danger" size="sm" onClick={onReject} disabled={acting}>
              <XCircle className="h-4 w-4" /> Reject
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose} disabled={acting}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
