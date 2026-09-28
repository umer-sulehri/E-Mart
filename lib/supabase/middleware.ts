import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_OPTIONS,
  SUPABASE_COOKIE_OPTIONS,
  USER_ROLE_COOKIE_MAX_AGE,
} from "./cookie-options";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: SUPABASE_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          // Forward the library's options so a refreshed session cookie keeps
          // its Secure / SameSite / HttpOnly flags instead of falling back to
          // Next.js defaults.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile) {
      supabaseResponse.cookies.set("sb-user-role", profile.role, {
        ...AUTH_COOKIE_OPTIONS,
        maxAge: USER_ROLE_COOKIE_MAX_AGE,
      });
    }
  } else {
    supabaseResponse.cookies.delete("sb-user-role");
  }

  return supabaseResponse;
}
