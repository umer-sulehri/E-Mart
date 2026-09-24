/**
 * Client-side cookie-consent management.
 *
 * Consent preferences are stored locally (and mirrored to the server when
 * possible) and gate cookie-dependent features (Google Analytics and in-app
 * tracking events). "Essential" cookies — the Supabase session/auth cookies,
 * security cookies such as the impersonation guard, and cart persistence —
 * are required for the store to work and can never be disabled.
 *
 * Preferences are kept for 13 months and re-prompted when the banner version
 * configured in the store is bumped.
 */

export type ConsentCategory = "essential" | "analytics" | "marketing" | "social";

export type ConsentPreferences = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  social: boolean;
  // When the choice was made (ms epoch).
  timestamp: number;
  // When this choice stops being treated as valid (ms epoch).
  expiresAt: number;
  // Version of the consent banner / policy the visitor chose against.
  version: string;
};

export type ConsentMethod = "accept_all" | "reject_all" | "customize" | "withdraw";
export type ConsentSource = "banner" | "settings" | "footer";

const STORAGE_KEY = 'emart-consent';
const ANON_KEY_STORAGE = 'emart-consent-anon-id';
export const CONSENT_CHANGE_EVENT = 'emart-consent-change';

export const CONSENT_TTL_MS = 13 * 30 * 24 * 60 * 60 * 1000;
export const CURRENT_BANNER_VERSION = '1';

function defaultPreferences(): ConsentPreferences {
  return {
    essential: true,
    analytics: false,
    marketing: false,
    social: false,
    timestamp: Date.now(),
    expiresAt: Date.now() + CONSENT_TTL_MS,
    version: CURRENT_BANNER_VERSION,
  };
}

function normalize(raw: unknown): ConsentPreferences | null {
  try {
    const parsed = raw as Partial<ConsentPreferences>;
    if (!parsed || typeof parsed.analytics !== 'boolean') return null;
    return {
      essential: true,
      analytics: parsed.analytics,
      marketing: parsed.marketing === true,
      social: parsed.social === true,
      timestamp: typeof parsed.timestamp === 'number' ? parsed.timestamp : Date.now(),
      expiresAt:
        typeof parsed.expiresAt === 'number'
          ? parsed.expiresAt
          : typeof parsed.timestamp === 'number'
            ? parsed.timestamp + CONSENT_TTL_MS
            : Date.now() + CONSENT_TTL_MS,
      version: typeof parsed.version === 'string' ? parsed.version : '0',
    };
  } catch {
    return null;
  }
}

export function getConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = normalize(JSON.parse(raw));
    if (!parsed) return null;
    if (parsed.expiresAt <= Date.now()) {
      // Expired choice — treat as no consent and clear it.
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function hasConsent(): boolean {
  return getConsent() !== null;
}

export function isConsentValid(version = CURRENT_BANNER_VERSION): boolean {
  const consent = getConsent();
  if (!consent) return false;
  return consent.version === version;
}

export function isAnalyticsAllowed(): boolean {
  return getConsent()?.analytics ?? false;
}

export function isExpired(): boolean {
  const consent = getConsent();
  return consent === null;
}

export function getAnonymousKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    let key = window.localStorage.getItem(ANON_KEY_STORAGE);
    if (!key) {
      key = crypto.randomUUID();
      window.localStorage.setItem(ANON_KEY_STORAGE, key);
    }
    return `anon:${key}`;
  } catch {
    return '';
  }
}

export interface SetConsentOptions {
  analytics: boolean;
  marketing?: boolean;
  social?: boolean;
  method: ConsentMethod;
  source?: ConsentSource;
}

export function setConsent(options: SetConsentOptions): ConsentPreferences {
  const preferences: ConsentPreferences = {
    essential: true,
    analytics: options.analytics,
    marketing: options.marketing === true,
    social: options.social === true,
    timestamp: Date.now(),
    expiresAt: Date.now() + CONSENT_TTL_MS,
    version: CURRENT_BANNER_VERSION,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(
    new CustomEvent<ConsentPreferences>(CONSENT_CHANGE_EVENT, { detail: preferences })
  );

  const body = {
    preferences: {
      essential: true,
      analytics: options.analytics,
      marketing: preferences.marketing,
      social: preferences.social,
    },
    method: options.method,
    source: options.source || 'banner',
    subject: getAnonymousKey() || undefined,
  };

  void fetch('/api/v1/consent', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {});

  return preferences;
}

export function withdrawConsent(source: ConsentSource = 'footer'): void {
  const preferences: ConsentPreferences = {
    essential: true,
    analytics: false,
    marketing: false,
    social: false,
    timestamp: Date.now(),
    expiresAt: Date.now() + CONSENT_TTL_MS,
    version: CURRENT_BANNER_VERSION,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(
    new CustomEvent<ConsentPreferences>(CONSENT_CHANGE_EVENT, { detail: preferences })
  );

  void fetch('/api/v1/consent', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source,
      subject: getAnonymousKey() || undefined,
    }),
  }).catch(() => {});
}

export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}