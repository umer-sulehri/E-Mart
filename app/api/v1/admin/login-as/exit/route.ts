import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RESTORE_COOKIE = "emart_admin_restore";
const IMPERSONATE_COOKIE = "emart_impersonating";

const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60,
};

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

    response.cookies.delete(RESTORE_COOKIE);
    response.cookies.delete(IMPERSONATE_COOKIE);

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
          ...COOKIE_OPTIONS,
          httpOnly: true,
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
