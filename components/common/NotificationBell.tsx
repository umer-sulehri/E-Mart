'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BellIcon, CloseIcon } from '@/components/icons';
import { useHydrated } from '@/hooks/useHydrated';
import { useAuthStore } from '@/lib/store/authStore';
import {
  useNotificationFeed,
  useMarkAllNotificationsRead,
  FeedNotification,
} from '@/hooks/useNotifications';

function formatTimeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const { user } = useAuthStore();

  // Only poll the feed for authenticated users; guests see an empty bell.
  const { data, isLoading } = useNotificationFeed(15, hydrated && !!user);
  const markAllRead = useMarkAllNotificationsRead();

  const notifications: FeedNotification[] = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        aria-expanded={open}
        className="relative p-2 rounded-full transition-colors hover:bg-surface"
      >
        <BellIcon className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[9px] font-bold text-white rounded-full"
            style={{ background: 'var(--color-error)' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden z-50"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="p-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid #333' }}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Notifications{unread > 0 ? ` (${unread})` : ''}
              </span>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    disabled={markAllRead.isPending}
                    className="text-xs font-medium hover:underline disabled:opacity-50"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} aria-label="Close notifications">
                  <CloseIcon className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {!hydrated || !user ? (
                <div className="p-6 text-center">
                  <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    Sign in to see your notifications.
                  </p>
                  <Link
                    href="/login?next=/user/notifications"
                    onClick={() => setOpen(false)}
                    className="text-sm font-semibold hover:underline"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Sign in
                  </Link>
                </div>
              ) : isLoading ? (
                <p className="p-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Loading…
                </p>
              ) : notifications.length === 0 ? (
                <p className="p-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  You&apos;re all caught up!
                </p>
              ) : (
                notifications.map((n) => {
                  const content = (
                    <div
                      className="p-3 transition-colors hover:bg-bg"
                      style={{ borderBottom: '1px solid #222' }}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: n.isRead ? 'transparent' : 'var(--color-error)' }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{n.title}</p>
                          {n.message && (
                            <p className="text-xs line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{n.message}</p>
                          )}
                          <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {formatTimeAgo(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                  return n.link ? (
                    <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  ) : (
                    <div key={n.id}>{content}</div>
                  );
                })
              )}
            </div>
            {hydrated && user && notifications.length > 0 && (
              <div className="p-2 text-center" style={{ borderTop: '1px solid #333' }}>
                <Link
                  href="/user/notifications"
                  onClick={() => setOpen(false)}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
