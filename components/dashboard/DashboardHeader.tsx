'use client';

import Link from 'next/link';
import { Search, Bell, Truck, HelpCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function DashboardHeader() {
  const { user } = useAuthStore();

  return (
    <header className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-secondary-800">My Account</h1>
        <p className="text-sm text-muted-500">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-lg border border-muted-200 bg-muted-50 py-2 pl-10 pr-4 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-64"
          />
        </div>

        <button className="relative rounded-lg border border-muted-200 bg-white p-2 text-muted-600 transition-colors hover:bg-muted-50">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-muted-50"
        >
          <Truck className="h-4 w-4" />
          <span className="hidden sm:inline">Track Order</span>
        </Link>

        <Link
          href="/help"
          className="inline-flex items-center gap-2 rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-muted-50"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Help Center</span>
        </Link>
      </div>
    </header>
  );
}
