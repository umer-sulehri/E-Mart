'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Bell, CheckCheck, Loader2, Inbox } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  data?: { link?: string };
}

export default function DashboardNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/notifications?limit=50');
      const json = await res.json();
      if (json.success) setNotifications(json.data || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/v1/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      });
      const json = await res.json();
      if (json.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        toast.success('All notifications marked as read');
      } else {
        toast.error(json.error || 'Failed to update notifications');
      }
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const markRead = async (id: string) => {
    setMarkingId(id);
    try {
      const res = await fetch('/api/v1/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: [id] }),
      });
      const json = await res.json();
      if (json.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } finally {
      setMarkingId(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-secondary-800">Notifications</h2>
          <p className="text-sm text-muted-500">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You are all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl bg-white py-16 text-center shadow-sm">
          <Inbox className="mx-auto mb-3 h-12 w-12 text-muted-300" />
          <p className="text-lg font-semibold text-secondary-800">No notifications</p>
          <p className="mt-1 text-sm text-muted-500">
            Updates about your orders and account will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const type = n.type?.toLowerCase() || '';
            const isOrder = type.includes('order') || type.includes('payment') || type.includes('review');
            const isPromo = type.includes('promo');
            return (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.is_read) markRead(n.id);
                }}
                className={cn(
                  'flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm transition-colors',
                  !n.is_read && 'cursor-pointer ring-1 ring-primary/40'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    isOrder && 'bg-primary/10 text-primary',
                    isPromo && 'bg-warning/10 text-warning',
                    !isOrder && !isPromo && 'bg-muted-100 text-muted-500'
                  )}
                >
                  <Bell className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        'font-medium',
                        n.is_read ? 'text-muted-600' : 'text-secondary-800'
                      )}
                    >
                      {n.title}
                    </p>
                    {!n.is_read && <Badge variant="primary" size="sm">New</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-600">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-400">
                    {new Date(n.created_at).toLocaleString('en-PK', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                    {markingId === n.id && ' · Reading...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
