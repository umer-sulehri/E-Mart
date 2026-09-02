'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  link?: string;
  is_read?: boolean;
  created_at?: string;
  data?: { link?: string };
}

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/v1/notifications?limit=10');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNotifications(json.data.slice(0, 10));
          setUnreadCount(typeof json.unread_count === 'number' ? json.unread_count : json.data.filter((n: Notification) => !(n.read ?? n.is_read)).length);
        }
      } catch {
        // Silent fail
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function markAllRead() {
    try {
      await fetch('/api/v1/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Silent fail
    }
  }

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-secondary-700 transition-colors hover:bg-muted-100"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-muted-100 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-muted-100 px-4 py-3">
            <h3 className="font-heading text-sm font-bold text-secondary-800">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary-500"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => {
                const isRead = notification.read ?? notification.is_read ?? false;
                const type = notification.type?.toLowerCase() || '';
                const isOrder = type.includes('order') || type.includes('payment') || type.includes('review');
                const isPromo = type.includes('promo');
                const createdDate = notification.createdAt ?? notification.created_at;
                const href = notification.link ?? notification.data?.link ?? '#';
                return (
                <Link
                  key={notification.id}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex gap-3 border-b border-muted-50 px-4 py-3 transition-colors hover:bg-muted-50',
                    !isRead && 'bg-primary/5'
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      isOrder && 'bg-primary/10 text-primary',
                      isPromo && 'bg-warning/10 text-warning',
                      !isOrder && !isPromo && 'bg-muted-100 text-muted-500'
                    )}
                  >
                    <Bell size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-sm',
                        isRead
                          ? 'text-muted-600'
                          : 'font-medium text-secondary-800'
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-500">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-400">
                      {createdDate ? new Date(createdDate).toLocaleDateString() : ''}
                    </p>
                  </div>
                  {!isRead && (
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </Link>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-muted-100 px-4 py-2.5">
              <Link
                href="/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-xs font-medium text-primary hover:text-primary-500"
              >
                View All Notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
