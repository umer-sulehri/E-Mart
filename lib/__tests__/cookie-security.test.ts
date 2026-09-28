import { describe, it, expect, afterEach, vi } from 'vitest';

/**
 * Guards the cookie security posture documented in the Cookie Reference table
 * on /cookie-policy. If any of these fail, the policy page is lying to
 * visitors (or a cookie has silently lost its protection).
 */

const ORIGINAL_ENV = process.env.NEXT_PUBLIC_COOKIE_SECURE;

afterEach(() => {
  if (ORIGINAL_ENV === undefined) delete process.env.NEXT_PUBLIC_COOKIE_SECURE;
  else process.env.NEXT_PUBLIC_COOKIE_SECURE = ORIGINAL_ENV;
  vi.resetModules();
});

async function loadModule(value?: string) {
  vi.resetModules();
  if (value === undefined) delete process.env.NEXT_PUBLIC_COOKIE_SECURE;
  else process.env.NEXT_PUBLIC_COOKIE_SECURE = value;
  return import('../supabase/cookie-options');
}

describe('cookie security defaults', () => {
  it('marks cookies Secure by default, even outside production', async () => {
    const mod = await loadModule();
    expect(mod.SECURE_COOKIES).toBe(true);
  });

  it('only disables Secure when explicitly opted out', async () => {
    const mod = await loadModule('false');
    expect(mod.SECURE_COOKIES).toBe(false);
  });

  it('treats any value other than "false" as opted in', async () => {
    const mod = await loadModule('true');
    expect(mod.SECURE_COOKIES).toBe(true);
  });
});

describe('Supabase session cookie options', () => {
  it('sets Secure and SameSite=Lax', async () => {
    const { SUPABASE_COOKIE_OPTIONS } = await loadModule();
    expect(SUPABASE_COOKIE_OPTIONS.secure).toBe(true);
    expect(SUPABASE_COOKIE_OPTIONS.sameSite).toBe('lax');
    expect(SUPABASE_COOKIE_OPTIONS.path).toBe('/');
  });

  it('stays readable by the browser SDK, as @supabase/ssr requires', async () => {
    const { SUPABASE_COOKIE_OPTIONS } = await loadModule();
    expect(SUPABASE_COOKIE_OPTIONS.httpOnly).toBe(false);
  });

  it('never sets a name, which would also override auth.storageKey', async () => {
    const { SUPABASE_COOKIE_OPTIONS } = await loadModule();
    expect('name' in SUPABASE_COOKIE_OPTIONS).toBe(false);
  });
});

describe('E-Mart auth cookie options', () => {
  it('marks the role and impersonation cookies HttpOnly and Secure', async () => {
    const { AUTH_COOKIE_OPTIONS } = await loadModule();
    expect(AUTH_COOKIE_OPTIONS.httpOnly).toBe(true);
    expect(AUTH_COOKIE_OPTIONS.secure).toBe(true);
    expect(AUTH_COOKIE_OPTIONS.sameSite).toBe('lax');
  });

  it('scopes the impersonation cookies to the endpoints that use them', async () => {
    const { IMPERSONATION_COOKIE_OPTIONS, IMPERSONATION_COOKIE_PATH } = await loadModule();
    expect(IMPERSONATION_COOKIE_OPTIONS.path).toBe(IMPERSONATION_COOKIE_PATH);
    expect(IMPERSONATION_COOKIE_PATH).toBe('/api/v1/admin/login-as');
  });

  it('expires the impersonation cookies after one hour', async () => {
    const { IMPERSONATION_COOKIE_OPTIONS } = await loadModule();
    expect(IMPERSONATION_COOKIE_OPTIONS.maxAge).toBe(60 * 60);
  });
});

describe('storage key registry', () => {
  it('matches the keys published in the cookie policy', async () => {
    const keys = await import('../storage-keys');
    expect(keys.CART_STORAGE_KEY).toBe('emart-cart');
    expect(keys.AUTH_STORAGE_KEY).toBe('emart-auth');
    expect(keys.COMPARE_STORAGE_KEY).toBe('emart-compare');
    expect(keys.CONSENT_STORAGE_KEY).toBe('emart-consent');
    expect(keys.CONSENT_ANON_STORAGE_KEY).toBe('emart-consent-anon-id');
    expect(keys.reviewDraftKey('blue-jeans')).toBe('emart-review-draft-blue-jeans');
  });

  it('expires review drafts after seven days, as the policy states', async () => {
    const { REVIEW_DRAFT_TTL_MS } = await import('../storage-keys');
    expect(REVIEW_DRAFT_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
