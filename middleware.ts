import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/contact",
  "/faq",
  "/terms",
  "/privacy-policy",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

const PUBLIC_PREFIXES = [
  "/products",
  "/api",
  "/_next",
  "/images",
  "/icons",
  "/favicon",
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;

  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }

  const staticExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".webp",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
  ];
  if (staticExtensions.some((ext) => pathname.endsWith(ext))) return true;

  return false;
}

function isProtectedRoute(
  pathname: string,
  pattern: string
): boolean {
  return pathname === pattern || pathname.startsWith(pattern + "/");
}

// Supabase SSR stores the auth session cookie either as the legacy "sb:token"
// or the v2 format "sb-<project-ref>-auth-token" (which may be chunked into
// "sb-<project-ref>-auth-token.0", ".1", ... for large JWTs). Detect any of
// these so a validly signed-in session is recognized regardless of format.
function hasSupabaseSession(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name === "sb:token" || c.name.includes("-auth-token"));
}

// Preserve the refreshed auth cookies (and the role cookie) that
// updateSession set on supabaseResponse when performing a redirect.
function redirectWithCookies(
  url: URL,
  supabaseResponse: NextResponse
): NextResponse {
  const res = NextResponse.redirect(url);
  for (const cookie of supabaseResponse.cookies.getAll()) {
    res.cookies.set(cookie);
  }
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return await updateSession(request);
  }

  const supabaseResponse = await updateSession(request);

  const userRole = supabaseResponse.cookies.get("sb-user-role")?.value;

  const hasAuth = hasSupabaseSession(request);

  if (isProtectedRoute(pathname, "/admin")) {
    if (!hasAuth) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return redirectWithCookies(url, supabaseResponse);
    }
    if (userRole !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return redirectWithCookies(url, supabaseResponse);
    }
  }

  if (isProtectedRoute(pathname, "/seller")) {
    if (!hasAuth) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return redirectWithCookies(url, supabaseResponse);
    }
    if (userRole !== "seller" && userRole !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return redirectWithCookies(url, supabaseResponse);
    }
  }

  if (isProtectedRoute(pathname, "/dashboard")) {
    if (!hasAuth) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return redirectWithCookies(url, supabaseResponse);
    }
  }

  if (isProtectedRoute(pathname, "/checkout")) {
    if (!hasAuth) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", "/checkout");
      return redirectWithCookies(url, supabaseResponse);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
