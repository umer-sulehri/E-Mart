'use client';

import { useUiStore } from '@/lib/store/uiStore';
import en from '@/public/locales/en.json';
import ur from '@/public/locales/ur.json';

const messages: Record<string, Record<string, string>> = { en, ur };

export function useTranslations() {
  const locale = useUiStore((s) => s.locale);
  const dir = locale === 'ur' ? 'rtl' : 'ltr';

  const t = (key: string): string => {
    const val = messages[locale]?.[key];
    return val ?? messages.en[key] ?? key;
  };

  return { t, locale, dir };
}
