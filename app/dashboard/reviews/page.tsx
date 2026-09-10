'use client';

import { useState } from 'react';
import { ClipboardList, Clock, MessagesSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import OrderedProducts from './components/OrderedProducts';
import MyReviewsPanel from './components/MyReviewsPanel';

type TabKey = 'ordered' | 'all' | 'pending';

const tabs: { key: TabKey; label: string; icon: typeof ClipboardList }[] = [
  { key: 'ordered', label: 'Ordered Products', icon: ClipboardList },
  { key: 'all', label: 'My Reviews', icon: MessagesSquare },
  { key: 'pending', label: 'Pending Moderation', icon: Clock },
];

export default function ReviewsPage() {
  const [tab, setTab] = useState<TabKey>('ordered');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-secondary-800">My Reviews</h2>
        <p className="mt-1 text-sm text-muted-500">
          Review purchased products, manage your reviews, and track moderation status.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Reviews sections"
        className="flex gap-1 overflow-x-auto rounded-xl bg-muted-100 p-1"
      >
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
              tab === key
                ? 'bg-white text-primary shadow-sm'
                : 'text-muted-600 hover:text-secondary-800'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'ordered' && (
        <OrderedProducts onCreated={() => setRefreshKey((k) => k + 1)} />
      )}
      {tab === 'all' && <MyReviewsPanel refreshKey={refreshKey} />}
      {tab === 'pending' && <MyReviewsPanel status="pending" refreshKey={refreshKey} />}
    </div>
  );
}