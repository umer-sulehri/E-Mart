'use client';

import { useState } from 'react';
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
  Package,
  TrendingUp,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

type SellerStatus = 'pending' | 'approved' | 'suspended';

interface MockSeller {
  id: string;
  storeName: string;
  ownerName: string;
  email: string;
  status: SellerStatus;
  productsCount: number;
  revenue: number;
  rating: number;
  registeredDate: string;
  logoColor: string;
}

const sellerColors = ['#6BB252', '#364127', '#F95F09', '#F5A623', '#a3be4c', '#5a9e3f', '#2d6a1e'];

const mockSellers: MockSeller[] = [
  { id: 'sel-001', storeName: 'Fresh Valley Farms', ownerName: 'Ahmed Khan', email: 'ahmed@freshvalley.pk', status: 'approved', productsCount: 45, revenue: 580000, rating: 4.8, registeredDate: '2025-01-15', logoColor: sellerColors[0] },
  { id: 'sel-002', storeName: 'Organic Basket', ownerName: 'Fatima Malik', email: 'fatima@organicbasket.pk', status: 'approved', productsCount: 38, revenue: 420000, rating: 4.7, registeredDate: '2025-02-10', logoColor: sellerColors[1] },
  { id: 'sel-003', storeName: 'Karachi Meats', ownerName: 'Ali Butt', email: 'ali@karachimeats.pk', status: 'approved', productsCount: 22, revenue: 390000, rating: 4.6, registeredDate: '2025-01-28', logoColor: sellerColors[2] },
  { id: 'sel-004', storeName: 'Green Grocery', ownerName: 'Sara Qureshi', email: 'sara@greengrocery.pk', status: 'approved', productsCount: 60, revenue: 310000, rating: 4.5, registeredDate: '2025-03-05', logoColor: sellerColors[3] },
  { id: 'sel-005', storeName: 'Dairy Direct', ownerName: 'Hassan Siddiqui', email: 'hassan@dairdirect.pk', status: 'approved', productsCount: 18, revenue: 275000, rating: 4.4, registeredDate: '2025-02-22', logoColor: sellerColors[4] },
  { id: 'sel-006', storeName: 'Spice World', ownerName: 'Ayesha Cheema', email: 'ayesha@spiceworld.pk', status: 'approved', productsCount: 35, revenue: 195000, rating: 4.3, registeredDate: '2025-04-12', logoColor: sellerColors[5] },
  { id: 'sel-007', storeName: 'Bakery Hub', ownerName: 'Usman Rao', email: 'usman@bakeryhub.pk', status: 'pending', productsCount: 0, revenue: 0, rating: 0, registeredDate: '2026-08-20', logoColor: sellerColors[6] },
  { id: 'sel-008', storeName: 'Seafood Express', ownerName: 'Zainab Sheikh', email: 'zainab@seafoodexpress.pk', status: 'pending', productsCount: 0, revenue: 0, rating: 0, registeredDate: '2026-08-21', logoColor: sellerColors[0] },
  { id: 'sel-009', storeName: 'Organic Harvest', ownerName: 'Bilal Gillani', email: 'bilal@organicharvest.pk', status: 'pending', productsCount: 0, revenue: 0, rating: 0, registeredDate: '2026-08-22', logoColor: sellerColors[1] },
  { id: 'sel-010', storeName: 'Fresh Bites', ownerName: 'Maryam Chaudhry', email: 'maryam@freshbites.pk', status: 'pending', productsCount: 0, revenue: 0, rating: 0, registeredDate: '2026-08-23', logoColor: sellerColors[2] },
  { id: 'sel-011', storeName: 'Daily Deals Mart', ownerName: 'Omar Bhatti', email: 'omar@dailydeals.pk', status: 'pending', productsCount: 0, revenue: 0, rating: 0, registeredDate: '2026-08-24', logoColor: sellerColors[3] },
  { id: 'sel-012', storeName: 'Frozen Paradise', ownerName: 'Hira Nawaz', email: 'hira@frozenparadise.pk', status: 'suspended', productsCount: 15, revenue: 45000, rating: 3.2, registeredDate: '2025-05-18', logoColor: sellerColors[4] },
  { id: 'sel-013', storeName: 'Snack Attack', ownerName: 'Khalid Iqbal', email: 'khalid@snackattack.pk', status: 'approved', productsCount: 28, revenue: 152000, rating: 4.1, registeredDate: '2025-06-02', logoColor: sellerColors[5] },
  { id: 'sel-014', storeName: 'Baby Care Plus', ownerName: 'Nadia Awan', email: 'nadia@babycare.pk', status: 'approved', productsCount: 42, revenue: 230000, rating: 4.5, registeredDate: '2025-04-30', logoColor: sellerColors[6] },
  { id: 'sel-015', storeName: 'Pantry Essentials', ownerName: 'Tariq Mirza', email: 'tariq@pantry.pk', status: 'suspended', productsCount: 10, revenue: 28000, rating: 2.8, registeredDate: '2025-07-14', logoColor: sellerColors[0] },
];

export default function AdminSellersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedSeller, setExpandedSeller] = useState<string | null>(null);

  const filtered = mockSellers.filter((s) => {
    const matchesSearch =
      s.storeName.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const total = mockSellers.length;
  const pendingCount = mockSellers.filter((s) => s.status === 'pending').length;
  const approvedCount = mockSellers.filter((s) => s.status === 'approved').length;
  const suspendedCount = mockSellers.filter((s) => s.status === 'suspended').length;

  const getStatusBadge = (status: SellerStatus) => {
    const map: Record<SellerStatus, { variant: 'success' | 'warning' | 'danger' }> = {
      pending: { variant: 'warning' },
      approved: { variant: 'success' },
      suspended: { variant: 'danger' },
    };
    return <Badge variant={map[status].variant} size="sm">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const getInitials = (name: string) =>
    name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">Sellers Management</h1>
        <p className="text-sm text-muted-500">Manage sellers and approval workflow</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{total}</p>
              <p className="text-xs text-muted-500">Total Sellers</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{pendingCount}</p>
              <p className="text-xs text-muted-500">Pending Approval</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 text-success-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{approvedCount}</p>
              <p className="text-xs text-muted-500">Active</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-100 text-danger-600">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{suspendedCount}</p>
              <p className="text-xs text-muted-500">Suspended</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Banner */}
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

      {/* Table */}
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
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100">
                <th className="pb-3 font-medium text-muted-500">Store</th>
                <th className="hidden pb-3 font-medium text-muted-500 md:table-cell">Owner</th>
                <th className="pb-3 font-medium text-muted-500">Status</th>
                <th className="hidden pb-3 font-medium text-muted-500 lg:table-cell">Products</th>
                <th className="hidden pb-3 font-medium text-muted-500 lg:table-cell">Revenue</th>
                <th className="hidden pb-3 font-medium text-muted-500 xl:table-cell">Rating</th>
                <th className="pb-3 font-medium text-muted-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-50">
              {filtered.map((seller) => (
                <>
                  <tr key={seller.id} className="hover:bg-muted-50/50">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                          style={{ backgroundColor: seller.logoColor }}
                        >
                          {getInitials(seller.storeName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-secondary-800">{seller.storeName}</p>
                          <p className="truncate text-xs text-muted-500 md:hidden">{seller.ownerName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden py-3 md:table-cell">
                      <p className="font-medium text-secondary-800">{seller.ownerName}</p>
                      <p className="text-xs text-muted-500">{seller.email}</p>
                    </td>
                    <td className="py-3">{getStatusBadge(seller.status)}</td>
                    <td className="hidden py-3 text-secondary-800 lg:table-cell">{seller.productsCount}</td>
                    <td className="hidden py-3 font-medium text-secondary-800 lg:table-cell">
                      {seller.revenue > 0 ? `₨${seller.revenue.toLocaleString()}` : '—'}
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
                          onClick={() => setExpandedSeller(expandedSeller === seller.id ? null : seller.id)}
                          className="rounded p-1.5 text-muted-500 transition-colors hover:bg-muted-100 hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {seller.status === 'pending' && (
                          <>
                            <button className="rounded p-1.5 text-muted-500 transition-colors hover:bg-success-50 hover:text-success">
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button className="rounded p-1.5 text-muted-500 transition-colors hover:bg-danger-50 hover:text-danger">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {seller.status === 'approved' && (
                          <button className="rounded p-1.5 text-muted-500 transition-colors hover:bg-danger-50 hover:text-danger">
                            <UserX className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedSeller === seller.id && (
                    <tr key={`${seller.id}-detail`}>
                      <td colSpan={7} className="bg-muted-50 px-6 py-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-xs font-medium text-muted-500">Store Name</p>
                            <p className="text-sm font-medium text-secondary-800">{seller.storeName}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-500">Owner</p>
                            <p className="text-sm text-secondary-800">{seller.ownerName}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-500">Email</p>
                            <p className="text-sm text-secondary-800">{seller.email}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-500">Registered</p>
                            <p className="text-sm text-secondary-800">
                              {new Date(seller.registeredDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-500">Products</p>
                            <p className="text-sm text-secondary-800">{seller.productsCount}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-500">Revenue</p>
                            <p className="text-sm font-medium text-secondary-800">
                              {seller.revenue > 0 ? `₨${seller.revenue.toLocaleString()}` : 'No revenue yet'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-500">Rating</p>
                            <p className="text-sm text-secondary-800">
                              {seller.rating > 0 ? `${seller.rating} / 5.0` : 'No ratings'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-500">Status</p>
                            <div className="mt-0.5">{getStatusBadge(seller.status)}</div>
                          </div>
                        </div>
                        {seller.status === 'pending' && (
                          <div className="mt-4 flex gap-2">
                            <Button variant="success" size="sm">
                              <CheckCircle2 className="h-4 w-4" />
                              Approve Seller
                            </Button>
                            <Button variant="danger" size="sm">
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
