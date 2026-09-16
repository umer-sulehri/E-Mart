'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Home,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EndpointResult {
  key: string;
  url: string;
  status: 'loading' | 'ok' | 'error';
  httpStatus?: number;
  message?: string;
}

const ENDPOINTS = [
  { key: 'earnings', url: '/api/v1/seller/earnings', label: 'Earnings / Stats' },
  { key: 'orders', url: '/api/v1/seller/orders?limit=5', label: 'Recent Orders' },
  { key: 'products', url: '/api/v1/seller/products?limit=5', label: 'Recent Products' },
  { key: 'trend', url: '/api/v1/seller/earnings/trend', label: 'Earnings Trend' },
  { key: 'profile', url: '/api/v1/seller/profile', label: 'Seller Profile' },
  { key: 'payout', url: '/api/v1/seller/payout', label: 'Payout Method' },
];

export default function SellerDebugPage() {
  const [results, setResults] = useState<EndpointResult[]>(
    ENDPOINTS.map((e) => ({ key: e.key, url: e.url, status: 'loading' }))
  );

  async function runChecks() {
    setResults(ENDPOINTS.map((e) => ({ key: e.key, url: e.url, status: 'loading' })));
    const next = [...results];
    for (const ep of ENDPOINTS) {
      try {
        const res = await fetch(ep.url);
        const json = await res.json();
        next[ENDPOINTS.findIndex((e) => e.key === ep.key)] = {
          key: ep.key,
          url: ep.url,
          status: json.success ? 'ok' : 'error',
          httpStatus: res.status,
          message: json.success ? undefined : json.error || `HTTP ${res.status}`,
        };
      } catch {
        next[ENDPOINTS.findIndex((e) => e.key === ep.key)] = {
          key: ep.key,
          url: ep.url,
          status: 'error',
          message: 'Network error',
        };
      }
      setResults([...next]);
    }
  }

  useEffect(() => {
    runChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const failed = results.filter((r) => r.status === 'error').length;
  const okCount = results.filter((r) => r.status === 'ok').length;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted-500">
        <Link href="/" className="inline-flex items-center gap-1 text-muted-500 transition-colors hover:text-primary">
          <Home className="h-3.5 w-3.5" />
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/seller" className="text-muted-500 transition-colors hover:text-primary">
          Seller Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-secondary-800">Diagnostics</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Diagnostics</h1>
          <p className="mt-1 text-sm text-muted-500">
            Developer tool that checks the health of seller API endpoints. Not shown in
            production navigation.
          </p>
        </div>
        <button
          onClick={runChecks}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-500"
        >
          <RefreshCw className="h-4 w-4" />
          Re-run checks
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-secondary-800">{results.length}</p>
          <p className="text-xs text-muted-500">Endpoints</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-success">{okCount}</p>
          <p className="text-xs text-muted-500">Healthy</p>
        </div>
        <div className="rounded-xl bg-white p-4 text-center shadow-sm">
          <p className={cn('text-2xl font-bold', failed > 0 ? 'text-danger' : 'text-secondary-800')}>
            {failed}
          </p>
          <p className="text-xs text-muted-500">Failed</p>
        </div>
      </div>

      <div className="divide-y divide-muted-50 rounded-xl bg-white shadow-sm">
        {results.map((r) => (
          <div key={r.key} className="flex items-center gap-4 px-6 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-secondary-800">
                {ENDPOINTS.find((e) => e.key === r.key)?.label}
              </p>
              <p className="truncate font-mono text-xs text-muted-500">{r.url}</p>
            </div>
            {r.status === 'loading' && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking...
              </span>
            )}
            {r.status === 'ok' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                <CheckCircle2 className="h-4 w-4" /> OK{r.httpStatus ? ` · ${r.httpStatus}` : ''}
              </span>
            )}
            {r.status === 'error' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">
                <XCircle className="h-4 w-4" />
                {r.message || `HTTP ${r.httpStatus}`}
              </span>
            )}
          </div>
        ))}
      </div>

      {failed > 0 && (
        <div className="flex items-start gap-3 rounded-xl bg-warning-50 p-4 text-sm text-warning-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Failed endpoints are usually temporary (network, auth session expiry, or a missing
            seller profile). Re-run the checks or sign in again. Persistent failures should be
            reported with the browser console output.
          </p>
        </div>
      )}
    </div>
  );
}