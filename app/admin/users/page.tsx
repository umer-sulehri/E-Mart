'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Search,
  Eye,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

type UserRole = 'customer' | 'seller' | 'admin';

function SkeletonRow() {
  return (
    <tr className="border-b border-muted-50">
      <td className="py-3 pr-4"><div className="h-4 w-4 animate-pulse rounded bg-muted-200" /></td>
      <td className="py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted-200" />
          <div className="space-y-1">
            <div className="h-4 w-28 animate-pulse rounded bg-muted-200" />
            <div className="h-3 w-36 animate-pulse rounded bg-muted-200" />
          </div>
        </div>
      </td>
      <td className="hidden py-3 md:table-cell"><div className="h-4 w-16 animate-pulse rounded bg-muted-200" /></td>
      <td className="hidden py-3 lg:table-cell"><div className="h-4 w-16 animate-pulse rounded bg-muted-200" /></td>
      <td className="hidden py-3 xl:table-cell"><div className="h-4 w-20 animate-pulse rounded bg-muted-200" /></td>
      <td className="hidden py-3 xl:table-cell"><div className="h-4 w-8 animate-pulse rounded bg-muted-200" /></td>
      <td className="py-3"><div className="h-4 w-16 animate-pulse rounded bg-muted-200" /></td>
    </tr>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const itemsPerPage = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', String(itemsPerPage));
      if (search) params.set('search', search);
      if (roleFilter !== 'all') params.set('role', roleFilter);

      const res = await fetch(`/api/v1/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        setTotalPages(data.meta?.totalPages || 1);
        setTotalItems(data.meta?.totalItems || 0);
      } else {
        toast.error(data.error || 'Failed to load users');
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (value: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearch(value);
      setCurrentPage(1);
    }, 400);
  };

  const handleBlock = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/block`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('User blocked');
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to block user');
      }
    } catch {
      toast.error('Failed to block user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/unblock`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('User unblocked');
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to unblock user');
      }
    } catch {
      toast.error('Failed to unblock user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Role updated');
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to update role');
      }
    } catch {
      toast.error('Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const map: Record<UserRole, { variant: 'primary' | 'secondary' | 'success' }> = {
      customer: { variant: 'secondary' },
      seller: { variant: 'success' },
      admin: { variant: 'primary' },
    };
    const v = map[role] || { variant: 'secondary' as const };
    return <Badge variant={v.variant} size="sm">{role.charAt(0).toUpperCase() + role.slice(1)}</Badge>;
  };

  const getStatusBadge = (isBlocked: boolean) => {
    return isBlocked
      ? <Badge variant="danger" size="sm">Blocked</Badge>
      : <Badge variant="success" size="sm">Active</Badge>;
  };

  const getInitials = (f: string, l: string) => `${(f ?? '')[0] ?? ''}${(l ?? '')[0] ?? ''}`.toUpperCase();

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">Users Management</h1>
        <p className="text-sm text-muted-500">Manage all platform users</p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
              <input
                type="text"
                placeholder="Search users..."
                defaultValue={search}
                onChange={(e) => handleSearchChange(e.target.value)}
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
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100">
                <th className="pb-3 font-medium text-muted-500">User</th>
                <th className="hidden pb-3 font-medium text-muted-500 md:table-cell">Role</th>
                <th className="hidden pb-3 font-medium text-muted-500 lg:table-cell">Status</th>
                <th className="hidden pb-3 font-medium text-muted-500 xl:table-cell">Joined</th>
                <th className="pb-3 font-medium text-muted-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : users.map((user: any) => (
                    <>
                      <tr key={user.id} className="hover:bg-muted-50/50">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                              {getInitials(user.first_name, user.last_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-secondary-800">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="truncate text-xs text-muted-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden py-3 md:table-cell">{getRoleBadge(user.role)}</td>
                        <td className="hidden py-3 lg:table-cell">{getStatusBadge(user.is_blocked)}</td>
                        <td className="hidden whitespace-nowrap py-3 text-muted-600 xl:table-cell">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                              className="rounded p-1.5 text-muted-500 transition-colors hover:bg-muted-100 hover:text-primary"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {user.is_blocked ? (
                              <button
                                onClick={() => handleUnblock(user.id)}
                                disabled={actionLoading === user.id}
                                className="rounded p-1.5 text-muted-500 transition-colors hover:bg-success-50 hover:text-success disabled:opacity-50"
                                title="Unblock User"
                              >
                                <UserCheck className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlock(user.id)}
                                disabled={actionLoading === user.id}
                                className="rounded p-1.5 text-muted-500 transition-colors hover:bg-danger-50 hover:text-danger disabled:opacity-50"
                                title="Block User"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedUser === user.id && (
                        <tr key={`${user.id}-detail`}>
                          <td colSpan={5} className="bg-muted-50 px-6 py-4">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              <div>
                                <p className="text-xs font-medium text-muted-500">Full Name</p>
                                <p className="text-sm font-medium text-secondary-800">{user.first_name} {user.last_name}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-500">Email</p>
                                <p className="text-sm text-secondary-800">{user.email}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-500">Role</p>
                                <select
                                  value={user.role}
                                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                  disabled={actionLoading === user.id}
                                  className="mt-1 rounded border border-muted-200 bg-white px-2 py-1 text-sm focus:outline-none"
                                >
                                  <option value="customer">Customer</option>
                                  <option value="seller">Seller</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-500">Joined</p>
                                <p className="text-sm text-secondary-800">{formatDate(user.created_at)}</p>
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

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-500">
              {totalItems > 0 ? `Showing ${startItem} to ${endItem} of ${totalItems}` : 'No results'}
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
                const p = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={cn(
                      'h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                      currentPage === p
                        ? 'bg-primary text-white'
                        : 'border border-muted-200 text-muted-600 hover:bg-muted-50'
                    )}
                  >
                    {p}
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
        )}
      </div>
    </div>
  );
}
