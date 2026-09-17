'use client';

import { useEffect, useState } from 'react';
import { Eye, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImpersonationInfo {
  name: string;
  role: string;
}

const COOKIE_NAME = 'emart_impersonating';

function readImpersonation(): ImpersonationInfo | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

  if (!match) return null;

  try {
    const value = decodeURIComponent(match.slice(COOKIE_NAME.length + 1));
    return JSON.parse(value) as ImpersonationInfo;
  } catch {
    return null;
  }
}

export default function ImpersonationBanner() {
  const [info, setInfo] = useState<ImpersonationInfo | null>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setInfo(readImpersonation());
  }, []);

  if (!info) return null;

  const handleExit = async () => {
    setExiting(true);
    try {
      const res = await fetch('/api/v1/admin/login-as/exit', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Returned to your admin account');
        window.location.href = '/admin/users';
        return;
      }
      toast.error(data.error || 'Failed to exit impersonation');
    } catch {
      toast.error('Failed to exit impersonation');
    } finally {
      setExiting(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-warning/50 bg-warning/10 px-4 py-2 shadow-lg backdrop-blur">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-3 text-sm text-secondary-800 sm:justify-between">
        <span className="inline-flex items-center gap-2">
          <Eye className="h-4 w-4 text-warning" />
          You are viewing the site as <strong>{info.name}</strong> ({info.role}).
        </span>
        <button
          type="button"
          onClick={handleExit}
          disabled={exiting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-secondary-700 disabled:opacity-60"
        >
          <LogOut className="h-3.5 w-3.5" />
          {exiting ? 'Exiting...' : 'Exit impersonation'}
        </button>
      </div>
    </div>
  );
}
