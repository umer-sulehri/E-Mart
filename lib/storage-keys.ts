/**
 * Canonical names for every browser-storage key E-Mart writes.
 *
 * Keeping the literals in one place means the Cookie Reference table on
 * `/cookie-policy` can be checked against the code by reading this file, and
 * logout can scrub them centrally.
 */

/** Zustand-persisted cart (Zustand `persist`). */
export const CART_STORAGE_KEY = 'emart-cart';

/** Zustand-persisted auth profile, minimised to non-sensitive display fields. */
export const AUTH_STORAGE_KEY = 'emart-auth';

/** Compare tray — session storage only, dies with the tab. */
export const COMPARE_STORAGE_KEY = 'emart-compare';

/** Consent record and its pseudonymous audit identifier. */
export const CONSENT_STORAGE_KEY = 'emart-consent';
export const CONSENT_ANON_STORAGE_KEY = 'emart-consent-anon-id';

/** Autosaved review drafts, one per product slug. */
export const REVIEW_DRAFT_PREFIX = 'emart-review-draft-';

/** Drafts hold free text that may contain PII, so they self-expire. */
export const REVIEW_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function reviewDraftKey(productSlug: string): string {
  return `${REVIEW_DRAFT_PREFIX}${productSlug}`;
}

function removeKeys(storage: Storage, predicate: (key: string) => boolean) {
  const doomed: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && predicate(key)) doomed.push(key);
  }
  doomed.forEach((key) => storage.removeItem(key));
}

/**
 * Drop everything tied to the signed-in identity on sign-out so a shared or
 * public device does not leak the previous user's profile or review drafts.
 *
 * The cart is intentionally left alone (it is not identity data and shoppers
 * expect it to survive a sign-in/out), and compare lives in session storage.
 */
export function purgeIdentityStorage() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    removeKeys(window.localStorage, (key) => key.startsWith(REVIEW_DRAFT_PREFIX));
  } catch {
    // Storage can be unavailable (private mode / disabled cookies); ignore.
  }
}
