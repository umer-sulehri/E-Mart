'use client';

import { useUiStore } from '@/lib/store/uiStore';
import { GlobeIcon } from '@/components/icons';

export function LanguageSwitcher() {
  const locale = useUiStore((s) => s.locale);
  const setLocale = useUiStore((s) => s.setLocale);

  const toggle = () => {
    setLocale(locale === 'en' ? 'ur' : 'en');
  };

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${locale === 'en' ? 'Urdu' : 'English'}`}
      className="inline-flex items-center justify-center min-w-[48px] min-h-[48px] px-3 gap-2 rounded-full text-sm font-medium text-text-primary hover:bg-surface-alt transition-colors"
    >
      <GlobeIcon className="w-5 h-5" />
      <span className="text-sm font-semibold uppercase">{locale === 'en' ? 'EN' : 'UR'}</span>
    </button>
  );
}
