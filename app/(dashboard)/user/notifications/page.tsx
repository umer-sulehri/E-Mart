'use client';

import { useState } from 'react';
import { PackageIcon, CheckCircleIcon, StarIcon, BellIcon } from '@/components/icons';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: typeof PackageIcon;
}

const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'Order Shipped',
    message: 'Your order #EM-20250208-002 has been shipped.',
    time: '2 hours ago',
    read: false,
    icon: PackageIcon,
  },
  {
    id: '2',
    title: 'Order Delivered',
    message: 'Your order #EM-20250201-001 has been delivered.',
    time: '1 day ago',
    read: true,
    icon: CheckCircleIcon,
  },
  {
    id: '3',
    title: 'Flash Sale',
    message: 'Up to 50% off on fresh produce!',
    time: '2 days ago',
    read: true,
    icon: StarIcon,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-border)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-primary)';
              e.currentTarget.style.color = 'var(--color-text-inverse)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-surface)';
              e.currentTarget.style.color = 'var(--color-primary)';
            }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <div
          className="rounded-[16px] p-12 text-center"
          style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}
        >
          <BellIcon className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-border)' }} />
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            No notifications
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            You&apos;re all caught up! New notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <button
                key={notification.id}
                onClick={() => markRead(notification.id)}
                className="flex items-start gap-4 p-4 rounded-[16px] text-left w-full transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: notification.read ? 'var(--color-surface)' : 'var(--color-bg)',
                  border: `1px solid ${notification.read ? 'transparent' : 'var(--color-primary)'}`,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.04)',
                }}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: notification.read ? 'var(--color-surface-alt)' : 'rgba(122,155,118,0.15)',
                    color: notification.read ? 'var(--color-text-secondary)' : 'var(--color-primary)',
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: 'var(--color-accent)' }}
                      />
                    )}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {notification.message}
                  </p>
                </div>

                {/* Time */}
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                  {notification.time}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
