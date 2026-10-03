'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Cookie, RotateCw } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { PAGE_SIZE as ITEMS_PER_PAGE } from '@/lib/pagination';
import { usePageParam } from '@/hooks/usePageParam';
import { formatDate } from '@/lib/utils';

interface ConsentAuditEntry {
  id: string;
  subject: string;
  action: string;
  method: string | null;
  source: string;
  region: string;
  previous: Record<string, boolean> | null;
  next: Record<string, boolean> | null;
  created_at: string;
  profiles?: { first_name: string; last_name: string; email: string } | null;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-muted-50">
      <td className="px-3 py-4 sm:px-6"><div className="h-4 w-36 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-3 py-4 sm:px-6"><div className="h-4 w-16 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-3 py-4 sm:px-6"><div className="h-4 w-32 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-3 py-4 sm:px-6"><div className="h-4 w-20 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-3 py-4 sm:px-6"><div className="h-4 w-24 animate-pulse rounded bg-muted-200" /></td>
    </tr>
  );
}

function preferenceDelta(preferences: Record<string, boolean> | null): string {
  if (!preferences) return '—';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(preferences)) {
    if (key === 'essential') continue;
    parts.push(`${key}: ${value ? '✓' : '✕'}`);
  }
  return parts.join(', ') || '—';
}

export default function AdminConsentAuditPage() {
  // `usePageParam` reads `useSearchParams`, which must sit behind Suspense.
  return (
    <Suspense>
      <AdminConsentAuditContent />
    </Suspense>
  );
}

function AdminConsentAuditContent() {
  const [records, setRecords] = useState<ConsentAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const { page, setPage } = usePageParam({ totalPages });

  const fetchRecords = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(ITEMS_PER_PAGE),
      });
      const res = await fetch(`/api/v1/admin/consent-audit?${params}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data || []);
        setTotalItems(data.meta?.totalItems || 0);
        // Read the page count from the API instead of re-deriving it from a
        // hardcoded page size, which silently drifts from the request above.
        setTotalPages(data.meta?.totalPages || 1);
      } else {
        toast.error(data.error || 'Failed to load consent records');
      }
    } catch {
      toast.error('Failed to load consent records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords(page);
  }, [fetchRecords, page]);

  const subjectLabel = (entry: ConsentAuditEntry) => {
    if (entry.action !== 'withdraw' && entry.subject.startsWith('user:')) {
      return entry.profiles ? `${entry.profiles.first_name} ${entry.profiles.last_name}` : 'Registered user';
    }
    return entry.subject;
  };

  const subjectSub = (entry: ConsentAuditEntry) => {
    if (entry.action !== 'withdraw' && entry.subject.startsWith('user:')) {
      return entry.profiles?.email || entry.subject;
    }
    return entry.region === 'unknown' ? 'Anonymous visitor' : `Anonymous (${entry.region})`;
  };

  const actionVariant = (action: string): 'success' | 'danger' | 'warning' | 'default' => {
    if (action === 'withdraw') return 'danger';
    if (action === 'set') return 'success';
    return 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Consent Audit</h1>
          <p className="text-sm text-muted-500">
            Every cookie-consent choice ever asserted (GDPR / CCPA compliance)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchRecords(page)}>
          <RotateCw className="size-4" />
          Refresh
        </Button>
      </div>

      {totalItems > 0 && (
        <p className="text-xs text-muted-500">
          {totalItems} record{totalItems === 1 ? '' : 's'} total
        </p>
      )}

      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100 bg-muted-50">
                <th className="px-6 py-3 font-medium text-muted-600">Subject</th>
                <th className="px-6 py-3 font-medium text-muted-600">Action</th>
                <th className="px-6 py-3 font-medium text-muted-600">Method / Source</th>
                <th className="px-6 py-3 font-medium text-muted-600">Preferences</th>
                <th className="px-6 py-3 font-medium text-muted-600">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : records.length === 0
                  ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <Cookie className="mx-auto mb-3 size-10 text-muted-300" />
                          <p className="text-sm text-muted-500">No consent records found</p>
                        </td>
                      </tr>
                    )
                  : records.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-muted-50 transition-colors hover:bg-muted-50/50"
                      >
                        <td className="px-3 py-4 sm:px-6">
                          <p className="font-medium text-secondary-800">
                            {subjectLabel(record)}
                          </p>
                          <p className="text-xs text-muted-400">{subjectSub(record)}</p>
                        </td>
                        <td className="px-3 py-4 sm:px-6">
                          <Badge variant={actionVariant(record.action)}>
                            {record.action}
                          </Badge>
                        </td>
                        <td className="px-3 py-4 sm:px-6 text-muted-600">
                          <p>{record.method || '—'}</p>
                          <p className="text-xs text-muted-400">
                            {record.source} · {record.region === 'unknown' ? 'region n/a' : record.region}
                          </p>
                        </td>
                        <td className="px-3 py-4 sm:px-6 text-xs text-muted-600">
                          <p className="text-muted-400">← {preferenceDelta(record.previous)}</p>
                          <p>→ {preferenceDelta(record.next)}</p>
                        </td>
                        <td className="px-3 py-4 sm:px-6 text-muted-600">{formatDate(record.created_at)}</td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && totalPages > 1 && (
        <div className="rounded-xl bg-white shadow-sm">
          <Pagination
            variant="table"
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            itemLabel="records"
            className="border-t border-muted-100 px-3 py-4 sm:px-6"
          />
        </div>
      )}
    </div>
  );
}