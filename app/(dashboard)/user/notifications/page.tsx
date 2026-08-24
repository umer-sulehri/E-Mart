'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { PackageIcon, CheckCircleIcon, TruckIcon, ClockIcon, BellIcon } from '@/components/icons';
import { useOrders } from '@/hooks/useOrders';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/useNotifications';
import { Order, OrderStatus } from '@/lib/types';

const READ_KEY = 'emart-notifications-read';

// localStorage-backed read state exposed as an external store so React can
// read it without effects or hydration mismatches (server snapshot: none read).
let readListeners: Array<() => void> = [];
function emitReadChange() {
  readListeners.forEach((listener) => listener());
}
function subscribeRead(listener: () => void) {
  readListeners.push(listener);
  return () => {
    readListeners = readListeners.filter((l) => l !== listener);
  };
}
function getReadSnapshot(): string {
  try {
    return window.localStorage.getItem(READ_KEY) ?? '[]';
  } catch {
    return '[]';
  }
}
function getServerReadSnapshot(): string {
  return '[]';
}
function persistReadIds(ids: string[]) {
  try {
    window.localStorage.setItem(READ_KEY, JSON.stringify(ids));
  } catch {
    // storage unavailable â€” read state stays in memory only
  }
  emitReadChange();
}

interface DerivedNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: typeof PackageIcon;
}

function formatTimeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function orderToNotification(order: Order): DerivedNotification {
  const statusMessages: Record<OrderStatus, { title: string; message: string; icon: typeof PackageIcon }> = {
    pending: {
      title: 'Order Placed',
      message: `Order #${order.orderNumber} has been received and is awaiting confirmation.`,
      icon: ClockIcon,
    },
    confirmed: {
      title: 'Order Confirmed',
      message: `Order #${order.orderNumber} has been confirmed and is being prepared.`,
      icon: CheckCircleIcon,
    },
    processing: {
      title: 'Order Processing',
      message: `Order #${order.orderNumber} is being prepared for shipment.`,
      icon: PackageIcon,
    },
    shipped: {
      title: 'Order Shipped',
      message: `Order #${order.orderNumber} has shipped and is on its way.`,
      icon: TruckIcon,
    },
    delivered: {
      title: 'Order Delivered',
      message: `Order #${order.orderNumber} has been delivered. Enjoy!`,
      icon: CheckCircleIcon,
    },
    cancelled: {
      title: 'Order Cancelled',
      message: `Order #${order.orderNumber} was cancelled.`,
      icon: BellIcon,
    },
  };
  const info = statusMessages[order.status];
  return {
    id: `${order.id}:${order.status}`,
    title: info.title,
    message: info.message,
    time: formatTimeAgo(order.createdAt),
    icon: info.icon,
  };
}

function Toggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <h4 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>{label}</h4>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200 disabled:opacity-50"
        style={{ background: checked ? 'var(--color-primary)' : 'var(--color-border)' }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200"
          style={{ left: checked ? '22px' : '2px' }}
        />
      </button>
    </div>
  );
}

export default function NotificationsPage() {
  const { data: ordersData, isLoading } = useOrders(1, 10);
  const { data: preferences } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const readJson = useSyncExternalStore(subscribeRead, getReadSnapshot, getServerReadSnapshot);
  const readIds: string[] = JSON.parse(readJson);

  const notifications: DerivedNotification[] = (ordersData?.orders ?? [])
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(orderToNotification);

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const markAllRead = () => persistReadIds(notifications.map((n) => n.id));
  const markRead = (id: string) => {
    if (!readIds.includes(id)) persistReadIds([...readIds, id]);
  };

  const handlePreferenceChange = (key: keyof NonNullable<typeof preferences>, value: boolean) => {
    if (!preferences) return;
    updatePreferences.mutate({
      emailNotifications: preferences.emailNotifications,
      pushNotifications: preferences.pushNotifications,
      orderUpdates: preferences.orderUpdates,
      promotions: preferences.promotions,
      [key]: value,
    });
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
              color: 'var(--color-primary-dark)',
              border: '1px solid var(--color-border)',
            }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification list */}
      {isLoading ? (
        <p className="py-8 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Loading notificationsâ€¦
        </p>
      ) : notifications.length === 0 ? (
        <div
          className="rounded-[16px] p-12 text-center"
          style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}
        >
          <BellIcon className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-border)' }} />
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            No notifications
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            You&apos;re all caught up! Order updates will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notification) => {
            const isRead = readIds.includes(notification.id);
            const Icon = notification.icon;
            return (
              <Link
                key={notification.id}
                href="/user/orders"
                onClick={() => markRead(notification.id)}
                className="flex items-start gap-4 p-4 rounded-[16px] transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: isRead ? 'var(--color-surface)' : 'var(--color-bg)',
                  border: `1px solid ${isRead ? 'transparent' : 'var(--color-primary)'}`,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.04)',
                }}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isRead ? 'var(--color-surface-alt)' : 'rgba(217,176,140,0.15)',
                    color: isRead ? 'var(--color-text-secondary)' : 'var(--color-primary)',
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
                    {!isRead && (
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
              </Link>
            );
          })}
        </div>
      )}

      {/* Preferences */}
      <div
        className="rounded-[16px] p-6 mt-6"
        style={{ background: 'var(--color-surface)', boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center justify-between mb-2 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Notification Preferences
          </h3>
          {updatePreferences.isPending && (
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Savingâ€¦</span>
          )}
          {updatePreferences.isError && (
            <span className="text-xs font-semibold" style={{ color: 'var(--color-error)' }}>Save failed</span>
          )}
        </div>
        {preferences ? (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            <Toggle
              label="Email Notifications"
              description="Receive order updates via email."
              checked={preferences.emailNotifications}
              disabled={updatePreferences.isPending}
              onChange={(v) => handlePreferenceChange('emailNotifications', v)}
            />
            <Toggle
              label="Push Notifications"
              description="Get alerts about order activity on this device."
              checked={preferences.pushNotifications}
              disabled={updatePreferences.isPending}
              onChange={(v) => handlePreferenceChange('pushNotifications', v)}
            />
            <Toggle
              label="Order Updates"
              description="Status changes for your orders (confirmed, shipped, delivered)."
              checked={preferences.orderUpdates}
              disabled={updatePreferences.isPending}
              onChange={(v) => handlePreferenceChange('orderUpdates', v)}
            />
            <Toggle
              label="Promotions"
              description="Occasional deals and offers from E-Mart."
              checked={preferences.promotions}
              disabled={updatePreferences.isPending}
              onChange={(v) => handlePreferenceChange('promotions', v)}
            />
          </div>
        ) : (
          <p className="py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading preferencesâ€¦</p>
        )}
      </div>
    </div>
  );
}

