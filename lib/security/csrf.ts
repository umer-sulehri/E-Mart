import { NextRequest, NextResponse } from 'next/server';

export const CSRF_COOKIE = 'emart_csrf';
export const CSRF_HEADER = 'x-csrf-token';

/**
 * Double-submit cookie CSRF protection.
 * The token is set as a cookie (readable by JS, SameSite=Lax) and must be
 * echoed back in the x-csrf-token header on state-changing requests.
 */
export function verifyCsrf(request: NextRequest): boolean {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    return true;
  }

  // Webhooks are authenticated by provider signatures instead of CSRF tokens.
  if (request.nextUrl.pathname.includes('/webhook')) {
    return true;
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  // When no CSRF cookie has been issued yet (first visit / API-only clients),
  // SameSite=Lax cookies already mitigate cross-site POSTs. Enforcement kicks
  // in once a token exists.
  if (!cookieToken) return true;

  return !!headerToken && headerToken === cookieToken;
}

export function csrfFailure(): NextResponse {
  return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
}
