'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Mail,
  Search,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  MailOpen,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface Submission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

type Filter = 'all' | 'open' | 'resolved';

export default function AdminContactPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/contact?status=${filter}`);
      const json = await res.json();
      if (json.success) setSubmissions(json.data || []);
      else setError(json.error || 'Failed to load submissions');
    } catch {
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [filter, load]);

  const toggleResolved = async (sub: Submission) => {
    setUpdating(sub.id);
    try {
      const res = await fetch(`/api/v1/admin/contact/${sub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_resolved: !sub.is_resolved }),
      });
      const json = await res.json();
      if (json.success) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === sub.id ? { ...s, is_resolved: !s.is_resolved } : s
          )
        );
      } else {
        setError(json.error || 'Update failed');
      }
    } catch {
      setError('Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = submissions.filter((s) =>
    (s.name + s.email + s.subject).toLowerCase().includes(search.toLowerCase())
  );

  const openCount = submissions.filter((s) => !s.is_resolved).length;
  const resolvedCount = submissions.filter((s) => s.is_resolved).length;

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: submissions.length },
    { id: 'open', label: 'Open', count: openCount },
    { id: 'resolved', label: 'Resolved', count: resolvedCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">Contact Submissions</h1>
        <p className="text-sm text-muted-500">Incoming customer enquiries</p>
      </div>

      {error && (
        <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">{error}</div>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  filter === tab.id
                    ? 'bg-primary text-white'
                    : 'bg-muted-100 text-muted-600 hover:bg-muted-200'
                )}
              >
                {tab.label}
                <span className="ml-1.5 opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-400" />
            <input
              type="text"
              placeholder="Search submissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-muted-200 bg-white py-2 pl-10 pr-4 text-sm text-secondary-800 placeholder:text-muted-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6 rounded-lg bg-muted-50 py-12 text-center text-muted-500">
            <MessageSquare className="mx-auto mb-2 h-8 w-8" />
            No submissions found
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filtered.map((sub) => (
              <div
                key={sub.id}
                className={cn(
                  'rounded-xl border p-4 transition-colors',
                  sub.is_resolved ? 'border-muted-100 bg-muted-50/50' : 'border-muted-200 bg-white'
                )}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-secondary-800">{sub.subject}</p>
                      <Badge variant={sub.is_resolved ? 'success' : 'warning'} size="sm">
                        {sub.is_resolved ? 'Resolved' : 'Open'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-500">
                      {sub.name} · {sub.email} ·{' '}
                      {new Date(sub.created_at).toLocaleString('en-PK', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpanded(expanded === sub.id ? null : sub.id)}
                    className="rounded-lg bg-muted-100 px-3 py-1.5 text-xs font-medium text-secondary-700 hover:bg-muted-200"
                  >
                    {expanded === sub.id ? 'Hide' : 'View'}
                  </button>
                </div>

                {expanded === sub.id && (
                  <div className="mt-4 rounded-lg bg-muted-50 p-4">
                    <p className="whitespace-pre-wrap text-sm text-secondary-800">
                      {sub.message}
                    </p>
                    <button
                      onClick={() => toggleResolved(sub)}
                      disabled={updating === sub.id}
                      className={cn(
                        'mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60',
                        sub.is_resolved
                          ? 'bg-muted-400 hover:bg-muted-500'
                          : 'bg-primary hover:bg-primary-500'
                      )}
                    >
                      {updating === sub.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : sub.is_resolved ? (
                        <RotateCcw className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {sub.is_resolved ? 'Mark as Open' : 'Mark as Resolved'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{openCount}</p>
              <p className="text-xs text-muted-500">Open</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 text-success-600">
              <MailOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-800">{resolvedCount}</p>
              <p className="text-xs text-muted-500">Resolved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
