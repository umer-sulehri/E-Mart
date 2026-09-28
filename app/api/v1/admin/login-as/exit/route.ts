import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  AUTH_COOKIE_OPTIONS,
  IMPERSONATION_COOKIE_PATH,
  USER_ROLE_COOKIE_MAX_AGE,
} from "@/lib/supabase/cookie-options";

const RESTORE_COOKIE = "emart_admin_restore";
const IMPERSONATE_COOKIE = "emart_impersonating";

export async function POST(request: NextRequest) {
  try {
    const restoreToken = request.cookies.get(RESTORE_COOKIE)?.value;

    if (!restoreToken) {
      return NextResponse.json(
        { success: false, error: "Not currently impersonating" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.refreshSession({
      refresh_token: restoreToken,
    });

    if (error) {
      console.error("[admin/login-as/exit] refresh error:", error);
      return NextResponse.json(
        { success: false, error: "Could not restore your admin session" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Admin session restored",
    });

    // The path must match the one the cookies were written with, otherwise the
    // browser treats these as different cookies and they survive logout.
    const scopedOptions = { path: IMPERSONATION_COOKIE_PATH };
    response.cookies.set(RESTORE_COOKIE, "", { ...scopedOptions, maxAge: 0 });
    response.cookies.set(IMPERSONATE_COOKIE, "", { ...scopedOptions, maxAge: 0 });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role) {
        response.cookies.set("sb-user-role", profile.role, {
          ...AUTH_COOKIE_OPTIONS,
          maxAge: USER_ROLE_COOKIE_MAX_AGE,
        });
      }
    }

    return response;
  } catch (error) {
    console.error("[admin/login-as/exit] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
