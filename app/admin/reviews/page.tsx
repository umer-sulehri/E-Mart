'use client';

import { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Flag,
  Trash2,
  Star,
  MessageSquare,
  Clock,
  ShieldAlert,
  ThumbsUp,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

type ReviewStatus = 'pending' | 'approved' | 'flagged';

const userNames = [
  'Ahmed Khan', 'Fatima Malik', 'Ali Butt', 'Sara Qureshi', 'Hassan Siddiqui',
  'Ayesha Cheema', 'Usman Rao', 'Zainab Sheikh', 'Bilal Gillani', 'Maryam Chaudhry',
  'Omar Bhatti', 'Hira Nawaz', 'Khalid Iqbal', 'Nadia Awan', 'Tariq Mirza',
  'Sana Baig', 'Imran Hussain', 'Rabia Akhtar', 'Faisal Javed', 'Amna Yousaf',
];

const productNames = [
  'Basmati Rice Premium 5kg', "Olper's Milk 1L", 'Organic Chicken Breast 1kg',
  'Fresh Tomatoes 1kg', 'Nestle Pure Water 1.5L', 'Folgers Coffee 200g',
  'Dal Masoor 1kg', 'Sugar Refined 2kg', 'Cooking Oil 3L', 'Atta Flour 10kg',
  'Organic Honey 500g', 'Greek Yogurt 500g', 'Almarai Cheese 200g', 'Lays Chips Family Pack',
  'Coca Cola 1.5L', 'Tang Orange 500g', 'Nestle Cream 200g', 'Fresh Bananas 1 dozen',
  'Potatoes 5kg', 'Onions 2kg',
];

const reviewTexts = [
  'Excellent quality! The rice was fresh and aromatic. Will order again.',
  'Great product, fast delivery. Highly recommended for families.',
  'Average quality. Could be better for the price.',
  'Amazing taste and freshness. Best online grocery experience.',
  'Product was damaged on arrival. Very disappointed.',
  'Perfect for daily use. Good value for money.',
  'Not as described. The packaging was poor.',
  'Outstanding! Fresh produce delivered right to my door.',
  'Decent product but delivery was delayed by 2 days.',
  'Top quality! This is my go-to store for groceries.',
  'The chicken was not fresh. Needs better quality control.',
  'Superb! Everything was packed nicely and delivered on time.',
  'Fair product. Nothing special but gets the job done.',
  'Loved it! My whole family enjoys this product.',
  'Terrible experience. Will not order from this seller again.',
  'Good value for money. Satisfied with the purchase.',
  'Product quality has declined since my last order.',
  'Absolutely fantastic! 10/10 would recommend.',
  'Packaging could be improved. Product was okay.',
  'Best quality I have found online. Very happy!',
];

const mockReviews = Array.from({ length: 20 }, (_, i) => ({
  id: `rev-${String(i + 1).padStart(3, '0')}`,
  user: userNames[i],
  product: productNames[i],
  rating: Math.floor(Math.random() * 3) + 3,
  text: reviewTexts[i],
  date: new Date(2026, 7, Math.max(1, 25 - Math.floor(i / 2))).toISOString(),
  status: (['approved', 'pending', 'flagged'] as const)[i % 3],
  helpfulCount: Math.floor(Math.random() * 20),
}));

export default function AdminReviewsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = mockReviews.filter((r) => {
    const matchesSearch =
      r.user.toLowerCase().includes(search.toLowerCase()) ||
      r.product.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const total = mockReviews.length;
  const pendingCount = mockReviews.filter((r) => r.status === 'pending').length;
  const flaggedCount = mockReviews.filter((r) => r.status === 'flagged').length;
  const approvedCount = mockReviews.filter((r) => r.status === 'approved').length;

  const getStatusBadge = (status: ReviewStatus) => {
    const map: Record<ReviewStatus, { variant: 'success' | 'warning' | 'danger' }> = {
      pending: { variant: 'warning' },
      approved: { variant: 'success' },
      flagged: { variant: 'danger' },
    };
    return <Badge variant={map[status].variant} size="sm">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">Reviews Moderation</h1>
        <p className="text-sm text-muted-500">Review and moderate customer feedback</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{total}</p>
              <p className="text-xs text-muted-500">Total Reviews</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{pendingCount}</p>
              <p className="text-xs text-muted-500">Pending Approval</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-100 text-danger-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{flaggedCount}</p>
              <p className="text-xs text-muted-500">Flagged</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 text-success-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{approvedCount}</p>
              <p className="text-xs text-muted-500">Approved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Reviews Alert */}
      {flaggedCount > 0 && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <div>
              <p className="font-medium text-secondary-800">{flaggedCount} flagged reviews need attention</p>
              <p className="text-sm text-muted-600">Reviews flagged by users or auto-detected for policy violations</p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-muted-200 bg-white py-2 pl-10 pr-4 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm text-secondary-700 focus:border-primary focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>

        <div className="mt-4 space-y-4">
          {filtered.map((review) => (
            <div
              key={review.id}
              className={cn(
                'rounded-lg border p-4',
                review.status === 'flagged'
                  ? 'border-danger-200 bg-danger-50/30'
                  : 'border-muted-100 bg-white'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                    {review.user.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-secondary-800">{review.user}</p>
                      {getStatusBadge(review.status)}
                    </div>
                    <p className="text-xs text-muted-500">
                      on <span className="font-medium text-secondary-700">{review.product}</span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-400">
                  {new Date(review.date).toLocaleDateString('en-PK')}
                </p>
              </div>

              <div className="mt-2 flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < review.rating
                        ? 'fill-warning text-warning'
                        : 'text-muted-200'
                    )}
                  />
                ))}
              </div>

              <p className="mt-2 text-sm text-secondary-700">{review.text}</p>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-400">
                  <ThumbsUp className="h-3 w-3" />
                  {review.helpfulCount} found this helpful
                </div>
                <div className="flex items-center gap-1">
                  {review.status === 'pending' && (
                    <>
                      <button className="rounded px-2.5 py-1 text-xs font-medium text-success transition-colors hover:bg-success-50">
                        <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button className="rounded px-2.5 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger-50">
                        <Flag className="mr-1 inline h-3.5 w-3.5" />
                        Flag
                      </button>
                    </>
                  )}
                  {review.status === 'flagged' && (
                    <button className="rounded px-2.5 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger-50">
                      <Trash2 className="mr-1 inline h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
