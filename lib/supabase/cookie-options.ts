/**
 * Single source of truth for every cookie E-Mart sets.
 *
 * Centralising the flags means the `Secure` / `HttpOnly` / `SameSite` posture
 * can be audited in one place instead of being duplicated across middleware
 * and route handlers (where it previously drifted).
 *
 * `Secure` is ON by default. Browsers treat `http://localhost` as a secure
 * context, so local development keeps working. Set
 * `NEXT_PUBLIC_COOKIE_SECURE=false` ONLY if you must serve the app over plain
 * HTTP on a non-localhost host (e.g. a phone testing `http://<LAN-IP>:3000`).
 */
export const SECURE_COOKIES = process.env.NEXT_PUBLIC_COOKIE_SECURE !== 'false';

/** Admin impersonation cookies are only ever needed by these two endpoints. */
export const IMPERSONATION_COOKIE_PATH = '/api/v1/admin/login-as';

export const IMPERSONATION_COOKIE_MAX_AGE = 60 * 60;
export const USER_ROLE_COOKIE_MAX_AGE = 60 * 60;

/**
 * Options for the Supabase session cookie (`sb-<project-ref>-auth-token`).
 *
 * `httpOnly: false` is required: `@supabase/ssr`'s browser client reads the
 * session back out of `document.cookie` to stay in sync after a refresh.
 * `name` is deliberately omitted — passing it would also override
 * `auth.storageKey`, which would desync the browser and server clients.
 */
export const SUPABASE_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: false,
  secure: SECURE_COOKIES,
};

/** Options for E-Mart's own server-only cookies (role cache, impersonation). */
export const AUTH_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: true,
  secure: SECURE_COOKIES,
};

/** Options for the impersonation cookies, scoped to the endpoints that use them. */
export const IMPERSONATION_COOKIE_OPTIONS = {
  ...AUTH_COOKIE_OPTIONS,
  path: IMPERSONATION_COOKIE_PATH,
  maxAge: IMPERSONATION_COOKIE_MAX_AGE,
};
