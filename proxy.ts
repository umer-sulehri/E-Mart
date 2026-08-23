import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RateEntry {
  count: number;
  timestamp: number;
}

const rateLimitMap = new Map<string, RateEntry>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 100;
const AUTH_RATE_LIMIT_MAX = 10;

function getRateLimitKey(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
  return `${ip}:${request.nextUrl.pathname}`;
}

function isRateLimited(key: string, max: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { count: 1, timestamp: now });
    return false;
  }
  entry.count++;
  return entry.count > max;
}

function limitForPath(pathname: string): number {
  if (pathname.startsWith('/api/v1/auth/')) return AUTH_RATE_LIMIT_MAX;
  if (pathname.startsWith('/api/v1/payments/')) return 20;
  return RATE_LIMIT_MAX;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    const key = getRateLimitKey(request);
    if (isRateLimited(key, limitForPath(pathname))) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  }

  const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (useSupabase) {
    const { updateSession } = await import('@/lib/supabase/middleware');
    const response = await updateSession(request);

    if (pathname.startsWith('/user') || pathname.startsWith('/admin') || pathname.startsWith('/seller')) {
      const session = request.cookies.get('sb-access-token')?.value ?? request.cookies.get('session')?.value;
      if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    return response;
  }

  const session = request.cookies.get('session')?.value;

  if (pathname.startsWith('/user') || pathname.startsWith('/admin') || pathname.startsWith('/seller')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const payload = JSON.parse(atob(session));
      if (pathname.startsWith('/admin') && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (pathname.startsWith('/seller') && payload.role !== 'seller' && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/user/:path*', '/admin/:path*', '/seller/:path*', '/api/:path*'],
};
