import { NextResponse } from 'next/server';

/**
 * Content-Security-Policy tuned for Next.js:
 * - 'unsafe-inline'/'unsafe-eval' in script-src are required by the Next.js
 *   runtime (hydration payloads and dev-mode HMR).
 * - Supabase (REST + realtime) and Stripe are allow-listed for connect-src.
 */
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
  "frame-src https://js.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://payments.jazzcash.com.pk https://easypay.easypaisa.com.pk",
  "frame-ancestors 'none'",
].join('; ');

export function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('Content-Security-Policy', CSP_DIRECTIVES);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  return response;
}
