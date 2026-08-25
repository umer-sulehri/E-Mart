import { type NextRequest } from "next/server";
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return await updateSession(request);
  }

  const supabaseResponse = await updateSession(request);

  const userRole = supabaseResponse.cookies.get("sb-user-role")?.value;

  const hasAuth =
    supabaseResponse.cookies.get("sb-access-token")?.value ||
    supabaseResponse.cookies.get("sb:token")?.value;

  if (isProtectedRoute(pathname, "/admin")) {
    if (!hasAuth) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return Response.redirect(url);
    }
    if (userRole !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return Response.redirect(url);
    }
  }

  if (isProtectedRoute(pathname, "/seller")) {
    if (!hasAuth) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return Response.redirect(url);
    }
    if (userRole !== "seller" && userRole !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return Response.redirect(url);
    }
  }

  if (isProtectedRoute(pathname, "/dashboard")) {
    if (!hasAuth) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return Response.redirect(url);
    }
  }

  if (isProtectedRoute(pathname, "/checkout")) {
    if (!hasAuth) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", "/checkout");
      return Response.redirect(url);
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
