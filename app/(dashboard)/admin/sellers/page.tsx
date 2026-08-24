'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAdminUsers, useBlockUser, useUnblockUser } from '@/hooks/useAdmin';
import { SearchIcon, UsersIcon, EyeIcon, BlockIcon, CheckCircleIcon } from '@/components/icons';

export default function SellersManagementPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useAdminUsers(1, 100);
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();

  const sellers = useMemo(() => {
    const users = data?.users ?? [];
    return users.filter((u) => u.role === 'seller');
  }, [data]);

  const filteredSellers = useMemo(() => {
    if (!search.trim()) return sellers;
    const q = search.toLowerCase();
    return sellers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.email?.toLowerCase().includes(q) ?? false)
    );
  }, [sellers, search]);

  const handleToggleBlock = (seller: (typeof sellers)[number]) => {
    if (seller.isBlocked) {
      unblockUser.mutate(seller.id);
    } else {
      blockUser.mutate(seller.id);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }} className="p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[12px]"
              style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
            >
              <UsersIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 style={{ color: 'var(--color-text-primary)' }} className="text-3xl font-bold">
                Seller Management
              </h1>
              <p style={{ color: 'var(--color-text-secondary)' }} className="mt-1 text-sm">
                {sellers.length} registered {sellers.length === 1 ? 'seller' : 'sellers'}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div
          className="mb-6 flex items-center gap-3 rounded-[14px] p-4"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <SearchIcon style={{ color: 'var(--color-text-secondary)' }} className="h-5 w-5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search sellers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 flex-1 rounded-[10px] border-none bg-transparent text-sm outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>

        {/* Sellers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-[14px]"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              />
            ))}
          </div>
        ) : filteredSellers.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-[14px] py-16"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <UsersIcon style={{ color: 'var(--color-text-secondary)' }} className="mb-3 h-12 w-12" />
            <p style={{ color: 'var(--color-text-secondary)' }} className="text-lg font-medium">
              No sellers found
            </p>
            <p style={{ color: 'var(--color-text-secondary)' }} className="mt-1 text-sm">
              {search ? 'Try a different search term' : 'No sellers have registered yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSellers.map((seller) => {
              const initial = seller.name.charAt(0).toUpperCase();
              const joinedDate = seller.createdAt
                ? new Date(seller.createdAt).toLocaleDateString()
                : 'â€”';
              const mockProducts = (seller.id.charCodeAt(0) % 30) + 1;
              const mockOrders = (seller.id.charCodeAt(0) % 120) + 5;

              return (
                <div
                  key={seller.id}
                  className="flex flex-col rounded-[14px] p-5 transition-transform hover:scale-[1.01]"
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {/* Top row: Avatar + Info */}
                  <div className="mb-4 flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #6B4E35, #3B2A1A)',
                        color: '#fff',
                      }}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        style={{ color: 'var(--color-text-primary)' }}
                        className="truncate text-base font-semibold"
                      >
                        {seller.name}
                      </h3>
                      <p
                        style={{ color: 'var(--color-text-secondary)' }}
                        className="mt-0.5 truncate text-sm"
                      >
                        {seller.email || 'No email'}
                      </p>
                      <p
                        style={{ color: 'var(--color-text-secondary)' }}
                        className="mt-0.5 truncate text-xs"
                      >
                        {seller.phone}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    <div
                      className="rounded-[10px] px-3 py-2 text-center"
                      style={{ background: 'var(--color-surface)' }}
                    >
                      <p style={{ color: 'var(--color-text-secondary)' }} className="text-xs">
                        Products
                      </p>
                      <p style={{ color: 'var(--color-text-primary)' }} className="text-sm font-semibold">
                        {mockProducts}
                      </p>
                    </div>
                    <div
                      className="rounded-[10px] px-3 py-2 text-center"
                      style={{ background: 'var(--color-surface)' }}
                    >
                      <p style={{ color: 'var(--color-text-secondary)' }} className="text-xs">
                        Orders
                      </p>
                      <p style={{ color: 'var(--color-text-primary)' }} className="text-sm font-semibold">
                        {mockOrders}
                      </p>
                    </div>
                  </div>

                  {/* Status + Joined */}
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        seller.isBlocked
                          ? 'bg-error/10 text-error'
                          : 'bg-success/10 text-success'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          seller.isBlocked ? 'bg-error' : 'bg-success'
                        }`}
                      />
                      {seller.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                    <span style={{ color: 'var(--color-text-secondary)' }} className="text-xs">
                      Joined {joinedDate}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex items-center gap-2">
                    <button
                      onClick={() => handleToggleBlock(seller)}
                      disabled={blockUser.isPending || unblockUser.isPending}
                      className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-[10px] border text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none ${
                        seller.isBlocked
                          ? 'border-success/30 bg-success/10 text-success hover:bg-success hover:text-white'
                          : 'border-error/30 bg-error/5 text-error hover:bg-error hover:text-white'
                      }`}
                    >
                      {seller.isBlocked ? (
                        <>
                          <CheckCircleIcon className="h-4 w-4" />
                          Approve Seller
                        </>
                      ) : (
                        <>
                          <BlockIcon className="h-4 w-4" />
                          Suspend Seller
                        </>
                      )}
                    </button>
                    <Link
                      href="/admin/products"
                      className="flex h-11 min-w-[48px] items-center justify-center gap-2 rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-primary/50 hover:bg-surface-alt"
                    >
                      <EyeIcon className="h-4 w-4" />
                      Products
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

