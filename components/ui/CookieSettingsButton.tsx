'use client';

import { useConsentUI } from '@/store/consentStore';

export default function CookieSettingsButton({ className }: { className?: string }) {
  const openSettings = useConsentUI((s) => s.openSettings);

  return (
    <button type="button" onClick={openSettings} className={className}>
      Cookie Settings
    </button>
  );
}