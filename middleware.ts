import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (useSupabase) {
    const response = await updateSession(request);
    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/user') || pathname.startsWith('/admin') || pathname.startsWith('/seller')) {
      const session = request.cookies.get('sb-access-token')?.value ?? request.cookies.get('session')?.value;
      if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    return response;
  }

  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/user') || pathname.startsWith('/admin') || pathname.startsWith('/seller')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const decoded = JSON.parse(atob(session));
      if (pathname.startsWith('/admin') && decoded.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (pathname.startsWith('/seller') && decoded.role !== 'seller' && decoded.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/user/:path*', '/admin/:path*', '/seller/:path*'],
};
