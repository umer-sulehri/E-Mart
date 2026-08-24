'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import {
  useAdminUsers,
  useBlockUser,
  useUnblockUser,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks/useAdmin';
import { User } from '@/lib/types';
import {
  SearchIcon,
  BlockIcon,
  EditIcon,
  EyeIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@/components/icons';

type RoleFilter = 'all' | 'admin' | 'seller' | 'buyer';

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: 'buyer' });
  const [formError, setFormError] = useState('');

  const currentUser = useAuthStore((s) => s.user);
  const { data, isLoading } = useAdminUsers(page, PAGE_SIZE);
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const updateUser = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const total = data?.total ?? 0;

  const filteredUsers = useMemo(() => {
    return (data?.users ?? []).filter((user) => {
      const matchesSearch =
        !search ||
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.phone?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [data, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleFilterChange = (role: RoleFilter) => {
    setRoleFilter(role);
    setPage(1);
  };

  const handleBlockToggle = (user: User) => {
    if (user.isBlocked) {
      unblockUser.mutate(user.id as string);
    } else {
      blockUser.mutate(user.id as string);
    }
  };

  const openEditModal = (user: User) => {
    setFormError('');
    setEditForm({
      name: (user.name as string) ?? '',
      email: (user.email as string) ?? '',
      phone: (user.phone as string) ?? '',
      role: (user.role as string) ?? 'buyer',
    });
    setEditUser(user);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    if (editForm.name.trim().length < 2) {
      setFormError('Name must be at least 2 characters.');
      return;
    }
    try {
      await updateUser.mutateAsync({
        id: editUser.id as string,
        body: {
          name: editForm.name.trim(),
          email: editForm.email.trim() || undefined,
          phone: editForm.phone.trim() || undefined,
          role: editForm.role,
        },
      });
      setEditUser(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update user.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteUser) return;
    try {
      await deleteUserMutation.mutateAsync(deleteUser.id as string);
      setDeleteUser(null);
    } catch {
      setDeleteUser(null);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return { background: 'var(--color-primary)', color: '#fff' };
      case 'seller':
        return { background: 'var(--color-accent, #f59e0b)', color: '#fff' };
      default:
        return { background: 'var(--color-success, #22c55e)', color: '#fff' };
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Joined', 'Status'];
    const rows = filteredUsers.map((u) => [
      u.id,
      u.name,
      u.email ?? '',
      u.phone,
      u.role,
      new Date(u.createdAt).toLocaleDateString(),
      u.isBlocked ? 'Blocked' : 'Active',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '32px', background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            User Management
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              margin: '4px 0 0',
            }}
          >
            {total} total users
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: '48px',
          }}
        >
          Export CSV
        </button>
      </div>

      {/* Search + Filters */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: '280px',
            position: 'relative',
          }}
        >
          <SearchIcon
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '20px',
              height: '20px',
              color: 'var(--color-text-secondary)',
            }}
          />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              paddingLeft: '44px',
              paddingRight: '16px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'admin', 'seller', 'buyer'] as RoleFilter[]).map((role) => (
            <button
              key={role}
              onClick={() => handleRoleFilterChange(role)}
              style={{
                height: '48px',
                padding: '0 20px',
                borderRadius: '10px',
                border:
                  roleFilter === role
                    ? '2px solid var(--color-primary)'
                    : '1px solid var(--color-border)',
                background:
                  roleFilter === role ? 'var(--color-primary)' : 'var(--color-surface)',
                color: roleFilter === role ? '#fff' : 'var(--color-text-secondary)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {role === 'all' ? 'All Roles' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  background: 'var(--color-primary-dark)',
                  color: 'var(--color-primary)',
                }}
              >
                {['ID', 'Name', 'Email', 'Type', 'Phone', 'Joined', 'Status', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: '16px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: '48px',
                      textAlign: 'center',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: '48px',
                      textAlign: 'center',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    {/* ID */}
                    <td
                      style={{
                        padding: '16px',
                        fontSize: '13px',
                        color: 'var(--color-text-secondary)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {(user.id as string).slice(0, 8)}...
                    </td>

                    {/* Name + Avatar */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background:
                              'linear-gradient(135deg, #6B4E35, #3B2A1A)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '16px',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {(user.name as string)?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {user.name as string}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td
                      style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {(user.email as string) ?? 'â€”'}
                    </td>

                    {/* Role Badge */}
                    <td style={{ padding: '16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          ...getRoleBadgeStyle(user.role as string),
                        }}
                      >
                        {user.role as string}
                      </span>
                    </td>

                    {/* Phone */}
                    <td
                      style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {user.phone as string}
                    </td>

                    {/* Joined */}
                    <td
                      style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: 'var(--color-text-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {new Date(user.createdAt as string).toLocaleDateString()}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          ...(user.isBlocked
                            ? {
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--color-error)',
                              }
                            : {
                                background: 'rgba(34, 197, 94, 0.1)',
                                color: 'var(--color-success, #22c55e)',
                              }),
                        }}
                      >
                        {user.isBlocked ? (
                          <XCircleIcon style={{ width: '14px', height: '14px' }} />
                        ) : (
                          <CheckCircleIcon style={{ width: '14px', height: '14px' }} />
                        )}
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setViewUser(user)}
                          title="View"
                          className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors"
                          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer' }}
                        >
                          <EyeIcon style={{ width: '14px', height: '14px' }} />
                          View
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          title="Edit"
                          className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors"
                          style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer' }}
                        >
                          <EditIcon style={{ width: '14px', height: '14px' }} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleBlockToggle(user)}
                          title={user.isBlocked ? 'Unblock' : 'Block'}
                          disabled={blockUser.isPending || unblockUser.isPending}
                          className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
                          style={{
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            background: user.isBlocked
                              ? 'rgba(34, 197, 94, 0.1)'
                              : 'rgba(239, 68, 68, 0.1)',
                            color: user.isBlocked
                              ? 'var(--color-success, #22c55e)'
                              : 'var(--color-error)',
                          }}
                        >
                          <BlockIcon style={{ width: '14px', height: '14px' }} />
                          {user.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                        <button
                          onClick={() => setDeleteUser(user)}
                          disabled={user.id === currentUser?.id || user.role === 'admin'}
                          title={
                            user.id === currentUser?.id
                              ? 'You cannot delete your own account'
                              : user.role === 'admin'
                                ? 'Admin accounts cannot be deleted'
                                : 'Delete (blocks the user)'
                          }
                          className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-xs font-semibold transition-colors"
                          style={{
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-surface)',
                            color:
                              user.id === currentUser?.id || user.role === 'admin'
                                ? 'var(--color-border)'
                                : 'var(--color-error)',
                            cursor: user.id === currentUser?.id || user.role === 'admin' ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <TrashIcon style={{ width: '14px', height: '14px' }} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                height: '40px',
                padding: '0 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: page <= 1 ? 'var(--color-border)' : 'var(--color-text-primary)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                height: '40px',
                padding: '0 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color:
                  page >= totalPages ? 'var(--color-border)' : 'var(--color-text-primary)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewUser && (
        <div
          onClick={() => setViewUser(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-surface)',
              borderRadius: '16px',
              padding: '32px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                }}
              >
                User Details
              </h2>
              <button
                onClick={() => setViewUser(null)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XCircleIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Name', value: viewUser.name as string },
                { label: 'Email', value: (viewUser.email as string) ?? 'â€”' },
                { label: 'Phone', value: viewUser.phone as string },
                {
                  label: 'Role',
                  value: (viewUser.role as string)?.charAt(0).toUpperCase() + (viewUser.role as string)?.slice(1),
                },
                {
                  label: 'Joined',
                  value: new Date(viewUser.createdAt as string).toLocaleDateString(),
                },
                { label: 'Status', value: (viewUser.isBlocked as boolean) ? 'Blocked' : 'Active' },
              ].map((field) => (
                <div key={field.label}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      marginBottom: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {field.label}
                  </div>
                  <div
                    style={{
                      fontSize: '15px',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div
          onClick={() => setEditUser(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-surface)',
              borderRadius: '16px',
              padding: '32px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                }}
              >
                Edit User
              </h2>
              <button
                onClick={() => setEditUser(null)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XCircleIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {formError && (
              <p
                style={{
                  margin: '0 0 16px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-error)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--color-error)',
                }}
              >
                {formError}
              </p>
            )}

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Name', key: 'name', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Phone', key: 'phone', type: 'tel' },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      marginBottom: '6px',
                    }}
                  >
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={(editForm as unknown as Record<string, string>)[field.key] ?? ''}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    required={field.key === 'name'}
                    style={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text-primary)',
                      padding: '0 16px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                  disabled={editUser.id === currentUser?.id}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text-primary)',
                    padding: '0 16px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                </select>
                {editUser.id === currentUser?.id && (
                  <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    You cannot change your own role.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  style={{
                    flex: 1,
                    height: '48px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateUser.isPending}
                  style={{
                    flex: 1,
                    height: '48px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: updateUser.isPending ? 'wait' : 'pointer',
                    opacity: updateUser.isPending ? 0.6 : 1,
                  }}
                >
                  {updateUser.isPending ? 'Savingâ€¦' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUser && (
        <div
          onClick={() => setDeleteUser(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-surface)',
              borderRadius: '16px',
              padding: '32px',
              width: '100%',
              maxWidth: '420px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <TrashIcon style={{ width: '32px', height: '32px', color: 'var(--color-error)' }} />
            </div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 8px',
              }}
            >
              Delete User
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                margin: '0 0 24px',
              }}
            >
              Delete <strong>{deleteUser.name as string}</strong>? The account will be
              blocked and unable to sign in. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setDeleteUser(null)}
                style={{
                  flex: 1,
                  height: '48px',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteUser.id === currentUser?.id || deleteUser.role === 'admin' || deleteUserMutation.isPending}
                title={
                  deleteUser.id === currentUser?.id
                    ? 'You cannot delete your own account'
                    : deleteUser.role === 'admin'
                      ? 'Admin accounts cannot be deleted'
                      : 'Block this user instead of deleting them'
                }
                style={{
                  flex: 1,
                  height: '48px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--color-error)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor:
                    deleteUser.id === currentUser?.id || deleteUser.role === 'admin' ? 'not-allowed' : 'pointer',
                  opacity: deleteUser.id === currentUser?.id || deleteUser.role === 'admin' ? 0.5 : 1,
                }}
              >
                {deleteUserMutation.isPending ? 'Blockingâ€¦' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

