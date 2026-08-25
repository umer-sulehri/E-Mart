'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  UserX,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Users,
  UserCheck,
  UserMinus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type UserStatus = 'active' | 'inactive' | 'suspended';
type UserRole = 'customer' | 'seller' | 'admin';

interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedDate: string;
  ordersCount: number;
  avatar: string;
}

const mockUsers: MockUser[] = Array.from({ length: 25 }, (_, i) => ({
  id: `usr-${String(i + 1).padStart(3, '0')}`,
  firstName: ['Ahmed', 'Fatima', 'Ali', 'Sara', 'Hassan', 'Ayesha', 'Usman', 'Zainab', 'Bilal', 'Maryam', 'Omar', 'Hira', 'Khalid', 'Nadia', 'Tariq', 'Sana', 'Imran', 'Rabia', 'Faisal', 'Amna', 'Danish', 'Laiba', 'Shahid', 'Mehwish', 'Rizwan'][i],
  lastName: ['Khan', 'Malik', 'Butt', 'Qureshi', 'Siddiqui', 'Cheema', 'Rao', 'Sheikh', 'Gillani', 'Chaudhry', 'Bhatti', 'Nawaz', 'Iqbal', 'Awan', 'Mirza', 'Baig', 'Hussain', 'Akhtar', 'Javed', 'Yousaf', 'Shah', 'Dar', 'Lodhi', 'Manzoor', 'Saeed'][i],
  email: `user${i + 1}@email.com`,
  role: i < 2 ? 'admin' : i < 8 ? 'seller' : 'customer',
  status: i < 18 ? 'active' : i < 22 ? 'inactive' : 'suspended',
  joinedDate: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
  ordersCount: Math.floor(Math.random() * 50),
  avatar: '',
}));

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredUsers = mockUsers.filter((u) => {
    const matchesSearch =
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalUsers = mockUsers.length;
  const activeUsers = mockUsers.filter((u) => u.status === 'active').length;
  const suspendedUsers = mockUsers.filter((u) => u.status === 'suspended').length;

  const toggleSelect = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map((u) => u.id));
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const map: Record<UserRole, { variant: 'primary' | 'secondary' | 'success' | 'warning' }> = {
      customer: { variant: 'secondary' },
      seller: { variant: 'success' },
      admin: { variant: 'primary' },
    };
    return <Badge variant={map[role].variant} size="sm">{role.charAt(0).toUpperCase() + role.slice(1)}</Badge>;
  };

  const getStatusBadge = (status: UserStatus) => {
    const map: Record<UserStatus, { variant: 'success' | 'default' | 'danger' }> = {
      active: { variant: 'success' },
      inactive: { variant: 'default' },
      suspended: { variant: 'danger' },
    };
    return <Badge variant={map[status].variant} size="sm">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const getInitials = (f: string, l: string) => `${f[0]}${l[0]}`.toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">Users Management</h1>
        <p className="text-sm text-muted-500">Manage all platform users</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{totalUsers}</p>
              <p className="text-xs text-muted-500">Total Users</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 text-success-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{activeUsers}</p>
              <p className="text-xs text-muted-500">Active</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-100 text-danger-600">
              <UserMinus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{suspendedUsers}</p>
              <p className="text-xs text-muted-500">Suspended</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        {/* Search & Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full rounded-lg border border-muted-200 bg-white py-2 pl-10 pr-4 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-700 focus:border-primary focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customer</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-700 focus:border-primary focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-500">{selectedUsers.length} selected</span>
              <Button variant="danger" size="sm">Suspend</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUsers([])}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100">
                <th className="pb-3 pr-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="pb-3 font-medium text-muted-500">User</th>
                <th className="hidden pb-3 font-medium text-muted-500 md:table-cell">Role</th>
                <th className="hidden pb-3 font-medium text-muted-500 lg:table-cell">Status</th>
                <th className="hidden pb-3 font-medium text-muted-500 xl:table-cell">Joined</th>
                <th className="hidden pb-3 font-medium text-muted-500 xl:table-cell">Orders</th>
                <th className="pb-3 font-medium text-muted-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-50">
              {paginatedUsers.map((user) => (
                <>
                  <tr key={user.id} className="hover:bg-muted-50/50">
                    <td className="py-3 pr-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        className="h-4 w-4 rounded border-muted-300 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-secondary-800">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="truncate text-xs text-muted-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden py-3 md:table-cell">{getRoleBadge(user.role)}</td>
                    <td className="hidden py-3 lg:table-cell">{getStatusBadge(user.status)}</td>
                    <td className="hidden whitespace-nowrap py-3 text-muted-600 xl:table-cell">
                      {new Date(user.joinedDate).toLocaleDateString('en-PK')}
                    </td>
                    <td className="hidden py-3 text-secondary-800 xl:table-cell">{user.ordersCount}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                          className="rounded p-1.5 text-muted-500 transition-colors hover:bg-muted-100 hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="rounded p-1.5 text-muted-500 transition-colors hover:bg-muted-100 hover:text-secondary-800">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button className="rounded p-1.5 text-muted-500 transition-colors hover:bg-danger-50 hover:text-danger">
                          <UserX className="h-4 w-4" />
                        </button>
                        <button className="rounded p-1.5 text-muted-500 transition-colors hover:bg-danger-50 hover:text-danger">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedUser === user.id && (
                    <tr key={`${user.id}-detail`}>
                      <td colSpan={7} className="bg-muted-50 px-6 py-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-xs font-medium text-muted-500">Full Name</p>
                            <p className="text-sm font-medium text-secondary-800">{user.firstName} {user.lastName}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-500">Email</p>
                            <p className="text-sm text-secondary-800">{user.email}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-500">Role</p>
                            <p className="text-sm text-secondary-800 capitalize">{user.role}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-500">Status</p>
                            <p className="text-sm capitalize text-secondary-800">{user.status}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-500">Joined</p>
                            <p className="text-sm text-secondary-800">{new Date(user.joinedDate).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-500">Total Orders</p>
                            <p className="text-sm text-secondary-800">{user.ordersCount}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
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
