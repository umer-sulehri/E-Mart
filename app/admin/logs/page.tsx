'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ScrollText, RotateCw, Activity } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { PAGE_SIZE as ITEMS_PER_PAGE } from '@/lib/pagination';
import { usePageParam } from '@/hooks/usePageParam';
import { formatDate } from '@/lib/utils';

interface LogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  profiles?: { first_name: string; last_name: string; email: string };
}

function SkeletonRow() {
  return (
    <tr className="border-b border-muted-50">
      <td className="px-3 py-4 sm:px-6"><div className="h-4 w-32 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-3 py-4 sm:px-6"><div className="h-4 w-20 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-3 py-4 sm:px-6"><div className="h-4 w-40 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-3 py-4 sm:px-6"><div className="h-4 w-28 animate-pulse rounded bg-muted-200" /></td>
    </tr>
  );
}

export default function AdminLogsPage() {
  return (
    <Suspense>
      <AdminLogsContent />
    </Suspense>
  );
}

function AdminLogsContent() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  const { page: currentPage, setPage: setCurrentPage } = usePageParam();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // The endpoint returns a page, not the whole table. Without paging the
      // view silently stopped at 50 rows with no indication more existed.
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(ITEMS_PER_PAGE),
      });
      const res = await fetch(`/api/v1/admin/logs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
        setTotalPages(data.meta?.totalPages || 1);
        setTotalItems(data.meta?.totalItems || 0);
      } else {
        toast.error(data.error || 'Failed to load logs');
      }
    } catch {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actionVariant = (action: string): 'success' | 'danger' | 'warning' | 'default' => {
    if (action.includes('delete') || action.includes('block') || action.includes('suspend')) return 'danger';
    if (action.includes('create') || action.includes('verify')) return 'success';
    if (action.includes('update') || action.includes('edit')) return 'warning';
    return 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Audit Logs</h1>
          <p className="text-sm text-muted-500">Track all administrative and system actions</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RotateCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-muted-100 bg-muted-50">
                <th className="px-6 py-3 font-medium text-muted-600">Action</th>
                <th className="px-6 py-3 font-medium text-muted-600">Entity</th>
                <th className="px-6 py-3 font-medium text-muted-600">User</th>
                <th className="px-6 py-3 font-medium text-muted-600">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : logs.length === 0
                  ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <Activity className="mx-auto mb-3 h-10 w-10 text-muted-300" />
                          <p className="text-sm text-muted-500">No logs found</p>
                        </td>
                      </tr>
                    )
                  : logs.map((log) => (
                      <tr key={log.id} className="border-b border-muted-50 transition-colors hover:bg-muted-50/50">
                        <td className="px-3 py-4 sm:px-6">
                          <Badge variant={actionVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-3 py-4 sm:px-6">
                          <p className="font-medium text-secondary-800 capitalize">{log.entity_type}</p>
                          {log.entity_id && (
                            <p className="text-xs text-muted-400">{log.entity_id}</p>
                          )}
                        </td>
                        <td className="px-3 py-4 sm:px-6 text-muted-600">
                          {log.profiles
                            ? `${log.profiles.first_name} ${log.profiles.last_name}`
                            : 'System'}
                        </td>
                        <td className="px-3 py-4 sm:px-6 text-muted-600">{formatDate(log.created_at)}</td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-muted-100 px-3 py-4 sm:px-6">
            <Pagination
              variant="table"
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={ITEMS_PER_PAGE}
              itemLabel="log entries"
              className="mt-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
