'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ScrollText, RotateCw, Activity } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
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
      <td className="px-6 py-4"><div className="h-4 w-32 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-20 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-40 animate-pulse rounded bg-muted-200" /></td>
      <td className="px-6 py-4"><div className="h-4 w-28 animate-pulse rounded bg-muted-200" /></td>
    </tr>
  );
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
      } else {
        toast.error(data.error || 'Failed to load logs');
      }
    } catch {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, []);

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
                        <td className="px-6 py-4">
                          <Badge variant={actionVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-secondary-800 capitalize">{log.entity_type}</p>
                          {log.entity_id && (
                            <p className="text-xs text-muted-400">{log.entity_id}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-muted-600">
                          {log.profiles
                            ? `${log.profiles.first_name} ${log.profiles.last_name}`
                            : 'System'}
                        </td>
                        <td className="px-6 py-4 text-muted-600">{formatDate(log.created_at)}</td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
