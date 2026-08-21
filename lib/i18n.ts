export type Locale = 'en' | 'ur';

const RTL_LOCALES: Locale[] = ['ur'];

export function getDirection(locale?: Locale): 'ltr' | 'rtl' {
  const lang = locale || getStoredLocale();
  return RTL_LOCALES.includes(lang) ? 'rtl' : 'ltr';
}

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem('emart-ui');
    if (stored) {
      const parsed = JSON.parse(stored);
      const locale = parsed?.state?.locale;
      if (locale === 'en' || locale === 'ur') return locale;
    }
  } catch {}
  return 'en';
}

export function formatDate(date: string | Date, locale?: Locale): string {
  const loc = locale || getStoredLocale();
  const d = new Date(date);
  return d.toLocaleDateString(loc === 'ur' ? 'ur-PK' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatNumber(num: number, locale?: Locale): string {
  const loc = locale || getStoredLocale();
  return num.toLocaleString(loc === 'ur' ? 'ur-PK' : 'en-US');
}

export function formatCurrency(amount: number, locale?: Locale): string {
  const loc = locale || getStoredLocale();
  return `Rs ${amount.toLocaleString(loc === 'ur' ? 'ur-PK' : 'en-US')}`;
}
