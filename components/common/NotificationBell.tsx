'use client';

import { useState } from 'react';
import { BellIcon, CloseIcon } from '@/components/icons';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, title: 'Order Shipped', message: 'Your order #1234 has been shipped!', time: '2 min ago', read: false },
  { id: 2, title: 'New Offer', message: '20% off on all electronics', time: '1 hour ago', read: false },
  { id: 3, title: 'Welcome', message: 'Welcome to E-Mart!', time: '1 day ago', read: true },
];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full transition-colors hover:bg-surface"
      >
        <BellIcon className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[9px] font-bold text-white rounded-full"
            style={{ background: 'var(--color-error)' }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-72 rounded-xl overflow-hidden z-50"
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
                Notifications
              </span>
              <button onClick={() => setOpen(false)}>
                <CloseIcon className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {MOCK_NOTIFICATIONS.map((n) => (
                <div
                  key={n.id}
                  className="p-3 transition-colors hover:bg-bg"
                  style={{ borderBottom: '1px solid #222' }}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: n.read ? 'transparent' : 'var(--color-error)' }}
                    />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{n.title}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{n.message}</p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
