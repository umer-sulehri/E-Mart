'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { CONSENT_CHANGE_EVENT, isAnalyticsAllowed } from '@/lib/consent';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

/** Delete Google Analytics cookies so withdrawal is effective immediately. */
function deleteGACookies(gaId: string) {
  const exclusion = `ga-disable-${gaId}`;
  const names = ['_ga', '_gid', '_gat', '_gat_gtag_' + gaId.replace(/^G-/, '')];
  names.forEach((name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname.replace(/^www\./, '')}; SameSite=Lax`;
  });
  (window as unknown as Record<string, unknown>)[exclusion] = true;
}

/**
 * Loads Google Analytics only after the visitor accepts analytics cookies.
 * If consent is later withdrawn, gtag.js is told to stop collecting (via the
 * standard `ga-disable-<id>` opt-out flag) and any GA cookies are removed.
 */
export default function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isAnalyticsAllowed());

    const onChange = () => {
      const allowed = isAnalyticsAllowed();
      setEnabled(allowed);
      if (!allowed && GA_ID) {
        deleteGACookies(GA_ID);
      }
    };

    window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
  }, []);

  if (!GA_ID || !enabled) return null;

  return (
    <>
      <Script
        id="ga-script"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}