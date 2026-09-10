import { headers } from 'next/headers';

/**
 * Resolves the absolute base URL for same-origin server-side fetches.
 *
 * The previous pattern (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
 * breaks in production because NEXT_PUBLIC_SITE_URL is often unset, so every
 * server-to-API self-fetch targets localhost and fails, collapsing valid product
 * pages into 404s. This reads the incoming request's Host header instead, so it
 * works on Vercel, behind proxies, and on any local dev port.
 */
export async function getSiteUrl(): Promise<string> {
  let host: string | null | undefined;
  try {
    const h = headers();
    // Next 14 returns a sync Headers instance; Next 15 returns a Promise.
    host = typeof h.get === 'function' ? h.get('x-forwarded-host') || h.get('host') : (await h).get('x-forwarded-host') || (await h).get('host');
  } catch {
    host = null;
  }

  if (host) {
    return `${process.env.NODE_ENV === 'development' ? 'http' : 'https'}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}