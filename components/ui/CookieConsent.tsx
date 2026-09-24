'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { hasConsent, setConsent } from '@/lib/consent';
import { useConsentUI } from '@/store/consentStore';

type ConsentConfig = {
  region?: string;
  bannerVersion?: string;
};

function isEuRegion(code?: string): boolean {
  if (!code || code === 'unknown') return false;
  // EEA + UK + Switzerland + others that follow the GDPR model.
  const eu = new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
    'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
    'SI', 'ES', 'SE', 'GB', 'CH', 'IS', 'LI', 'NO',
  ]);
  return eu.has((code || '').toUpperCase());
}

function isUsRegion(code?: string): boolean {
  return (code || '').toUpperCase() === 'US';
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [config, setConfig] = useState<ConsentConfig>({});
  const settingsOpen = useConsentUI((s) => s.settingsOpen);
  const openSettings = useConsentUI((s) => s.openSettings);
  const closeSettings = useConsentUI((s) => s.closeSettings);

  useEffect(() => {
    const fromStorage = (v: string): boolean | undefined => {
      if (!hasConsent()) return undefined;
      try {
        const raw = JSON.parse(v) as { analytics?: boolean; version?: string };
        return raw?.analytics ?? false;
      } catch {
        return undefined;
      }
    };

    const storedAnalytics = fromStorage(window.localStorage.getItem('emart-consent') || 'null');

    setAnalytics(storedAnalytics ?? false);

    const showIfNeeded = (bannerVersion?: string) => {
      if (!hasConsent()) return true;
      if (bannerVersion) {
        try {
          const raw = JSON.parse(
            window.localStorage.getItem('emart-consent') || '{}'
          ) as { version?: string };
          if ((raw?.version || '0') !== bannerVersion) return true;
        } catch {
          return true;
        }
      }
      return false;
    };

    let cancelled = false;
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch('/api/v1/consent');
          const json = (await res.json()) as { data?: ConsentConfig };
          if (cancelled) return;
          const next = json?.data || {};
          setConfig(next);
          setShowBanner(showIfNeeded(next.bannerVersion));
        } catch {
          if (!cancelled) setShowBanner(true);
        }
      })();
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  // Sync the toggle with the stored choice whenever the settings open.
  useEffect(() => {
    if (settingsOpen) {
      const raw = window.localStorage.getItem('emart-consent');
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { analytics?: boolean };
          setAnalytics(parsed?.analytics ?? false);
        } catch {
          setAnalytics(false);
        }
      }
    }
  }, [settingsOpen]);

  const region = config.region;

  const bannerCopy = () => {
    if (isEuRegion(region)) {
      return 'We use essential cookies to keep our store working. With your consent we also use analytics cookies to understand how the site is used, in line with the GDPR. You can change your choice at any time.';
    }
    if (isUsRegion(region)) {
      return 'We use essential cookies to keep our store working. With your consent we also use analytics cookies. We do not sell your personal information. You can change your choice at any time.';
    }
    return 'We use essential cookies to keep our store working, and — only if you agree — analytics cookies to understand how the site is used. We never sell your data. You can change your choice at any time.';
  };

  const acceptAll = () => {
    setConsent({ analytics: true, method: 'accept_all', source: 'banner' });
    setShowBanner(false);
    closeSettings();
  };

  const rejectAll = () => {
    setConsent({ analytics: false, method: 'reject_all', source: 'banner' });
    setShowBanner(false);
    closeSettings();
  };

  const savePreferences = () => {
    setConsent({ analytics, method: 'customize', source: settingsOpen ? 'settings' : 'banner' });
    setShowBanner(false);
    closeSettings();
  };

  return (
    <>
      {showBanner && !hasConsent() && (
        <div className="fixed bottom-0 left-0 z-40 w-full bg-secondary text-white">
          <div className="container mx-auto flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-12">
            <p className="text-sm text-white/80">{bannerCopy()}</p>
            {isUsRegion(region) && (
              <Link
                href="/privacy-policy#do-not-sell"
                className="text-sm font-medium text-white underline transition-colors hover:text-white/70"
              >
                Do Not Sell My Personal Information
              </Link>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={acceptAll}
                className="rounded bg-primary-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                Accept all
              </button>
              <button
                onClick={rejectAll}
                className="rounded bg-white/10 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                Reject all
              </button>
              <button
                onClick={openSettings}
                className="rounded border border-white/30 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Customize
              </button>
              <Link
                href="/cookie-policy"
                className="text-sm text-white/60 underline transition-colors hover:text-white"
              >
                Cookie Policy
              </Link>
              <Link
                href="/privacy-policy"
                className="text-sm text-white/60 underline transition-colors hover:text-white"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-settings-title"
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3
                  id="cookie-settings-title"
                  className="font-heading text-lg font-bold text-secondary-800"
                >
                  Cookie Preferences
                </h3>
                <p className="mt-1 text-sm text-secondary-600">
                  Choose which cookies this site may use. Essential cookies cannot be
                  turned off.
                </p>
              </div>
              <button
                onClick={closeSettings}
                className="ml-4 text-muted transition-colors hover:text-secondary"
                aria-label="Close cookie settings"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-muted-100 bg-muted-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <p className="text-sm font-semibold text-secondary-800">Essential</p>
                    <p className="mt-1 text-xs text-secondary-600">
                      Session and security cookies that let you sign in, keep your cart,
                      and protect your account. Always active.
                    </p>
                  </div>
                  <span
                    className="rounded-full bg-muted-200 px-3 py-1 text-xs font-medium text-muted"
                    aria-hidden="true"
                  >
                    Required
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-muted-100 p-4">
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <p className="text-sm font-semibold text-secondary-800">Analytics</p>
                    <p className="mt-1 text-xs text-secondary-600">
                      Google Analytics (anonymized IP) so we can see which pages are
                      popular and improve the store.{' '}
                      {isUsRegion(region) ? 'We do not sell your data.' : 'No personal data is sold.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={analytics}
                    aria-label="Toggle analytics cookies"
                    onClick={() => setAnalytics((v) => !v)}
                    className={
                      analytics
                        ? 'relative h-6 w-11 rounded-full bg-primary-600 transition-colors'
                        : 'relative h-6 w-11 rounded-full bg-muted-300 transition-colors'
                    }
                  >
                    <span
                      className={
                        analytics
                          ? 'absolute left-6 top-0.5 h-5 w-5 rounded-full bg-white transition-all'
                          : 'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-all'
                      }
                    />
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-secondary-500">
              You can change these choices at any time from the “Cookie Settings” link in
              the footer. See our{' '}
              <Link href="/cookie-policy" className="underline hover:text-primary">
                Cookie Policy
              </Link>{' '}
              for details.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={rejectAll}
                className="rounded-lg border border-muted-200 px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-muted-100"
              >
                Reject all
              </button>
              <button
                onClick={savePreferences}
                className="rounded-lg border border-muted-200 px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-muted-100"
              >
                Save preferences
              </button>
              <button
                onClick={acceptAll}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}