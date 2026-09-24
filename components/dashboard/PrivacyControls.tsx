'use client';

import { useState } from 'react';
import { Download, RefreshCcw, Cookie, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useConsentUI } from '@/store/consentStore';
import { useAuthStore } from '@/store/authStore';

export default function PrivacyControls() {
  const { user } = useAuthStore();
  const openSettings = useConsentUI((s) => s.openSettings);
  const [exporting, setExporting] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [eraseOpen, setEraseOpen] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);

  const downloadData = async () => {
    try {
      setExporting(true);
      const res = await fetch('/api/v1/privacy/export');
      if (res.status === 429) {
        toast.error('Too many requests, please try again shortly');
        return;
      }
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Failed to export data');
        return;
      }
      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emart-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Your data export has been downloaded');
    } catch {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const eraseData = async () => {
    try {
      setErasing(true);
      const res = await fetch('/api/v1/privacy/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Your personal data has been erased');
      } else {
        toast.error(data.error || 'Failed to erase data');
      }
    } catch {
      toast.error('Failed to erase data');
    } finally {
      setErasing(false);
    }
  };

  const unsubscribeNewsletter = async () => {
    try {
      setUnsubscribing(true);
      const res = await fetch('/api/v1/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email ?? '',
          confirm: 'UNSUBSCRIBE',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'You have been unsubscribed');
      } else {
        toast.error(data.error || 'Failed to unsubscribe');
      }
    } catch {
      toast.error('Failed to unsubscribe');
    } finally {
      setUnsubscribing(false);
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="font-bold text-secondary-800">Privacy & Data</h3>
      <p className="mt-1 text-sm text-muted-500">
        Exercise your privacy rights. We never sell your personal information.
      </p>

      <div className="mt-5 space-y-3">
        <div className="flex flex-col gap-3 border-b border-muted-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-secondary-800">Cookie preferences</p>
            <p className="text-xs text-muted-500">
              Review or change which cookies are used on this site.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={openSettings}>
            <Cookie className="h-4 w-4" />
            Manage cookies
          </Button>
        </div>

        <div className="flex flex-col gap-3 border-b border-muted-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-secondary-800">Download my data</p>
            <p className="text-xs text-muted-500">
              Get a copy of the personal data we hold about you (GDPR / CCPA).
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadData} loading={exporting} disabled={exporting}>
            <Download className="h-4 w-4" />
            {exporting ? 'Preparing…' : 'Download'}
          </Button>
        </div>

        <div className="flex flex-col gap-3 border-b border-muted-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-secondary-800">Unsubscribe from newsletter</p>
            <p className="text-xs text-muted-500">
              {user?.email
                ? `Remove ${user.email} from our mailing list.`
                : 'Stop receiving our newsletter.'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={unsubscribeNewsletter} loading={unsubscribing} disabled={unsubscribing}>
            <RefreshCcw className="h-4 w-4" />
            Unsubscribe
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-secondary-800">Delete my personal data</p>
            <p className="text-xs text-muted-500">
              Erase your personal data. Orders and reviews are kept for legal
              reasons but are no longer linked to you. This keeps your account
              active.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEraseOpen(true)}>
            <ShieldCheck className="h-4 w-4" />
            Erase data
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={eraseOpen}
        onClose={() => setEraseOpen(false)}
        onConfirm={() => {
          setEraseOpen(false);
          eraseData();
        }}
        title="Erase all your personal data?"
        message="This removes your addresses, cart, search history, newsletter subscription and more. Orders and reviews are retained but anonymized. This cannot be undone."
        variant="danger"
        confirmLabel="Erase my data"
        loading={erasing}
      />
    </div>
  );
}