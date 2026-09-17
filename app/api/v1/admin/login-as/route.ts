import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminLog } from "@/lib/audit";

const RESTORE_COOKIE = "emart_admin_restore";
const IMPERSONATE_COOKIE = "emart_impersonating";

const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60,
};

function redirectForRole(role: string): string {
  if (role === "seller") return "/seller";
  if (role === "admin") return "/admin";
  return "/dashboard";
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const userId = body?.userId;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: "You are already signed in as yourself" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: target } = await admin
      .from("profiles")
      .select("id, role, first_name, last_name, email")
      .eq("id", userId)
      .maybeSingle();

    if (!target) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (target.role === "admin") {
      return NextResponse.json(
        { success: false, error: "Cannot sign in as another admin" },
        { status: 400 }
      );
    }

    if (!target.email) {
      return NextResponse.json(
        { success: false, error: "This user has no email on file" },
        { status: 400 }
      );
    }

    // Capture the admin's own session so it can be restored when the
    // impersonation ends (stored in an httpOnly cookie).
    const {
      data: { session: adminSession },
    } = await supabase.auth.getSession();

    if (!adminSession?.refresh_token) {
      return NextResponse.json(
        { success: false, error: "Could not read your current session" },
        { status: 500 }
      );
    }

    // Mint a one-time magic link for the target user, then exchange its
    // hashed token for a real session on the same (cookie-backed) client.
    const { data: link, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: target.email,
      });

    const tokenHash = link?.properties?.hashed_token;

    if (linkError || !tokenHash) {
      console.error("[admin/login-as] generateLink error:", linkError);
      return NextResponse.json(
        { success: false, error: "Could not create a session for this user" },
        { status: 500 }
      );
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });

    if (verifyError) {
      console.error("[admin/login-as] verifyOtp error:", verifyError);
      return NextResponse.json(
        { success: false, error: "Could not create a session for this user" },
        { status: 500 }
      );
    }

    await writeAdminLog(supabase, user.id, {
      action: "login_as_user",
      entityType: "user",
      entityId: userId,
      details: { role: target.role, email: target.email },
    });

    const displayName =
      [target.first_name, target.last_name].filter(Boolean).join(" ").trim() ||
      target.email;

    const response = NextResponse.json({
      success: true,
      data: { role: target.role, redirectTo: redirectForRole(target.role) },
      message: `Now viewing as ${displayName}`,
    });

    response.cookies.set(RESTORE_COOKIE, adminSession.refresh_token, {
      ...COOKIE_OPTIONS,
      httpOnly: true,
    });
    response.cookies.set("sb-user-role", target.role, {
      ...COOKIE_OPTIONS,
      httpOnly: true,
    });
    // Readable flag so the UI can show an "exit impersonation" banner.
    response.cookies.set(
      IMPERSONATE_COOKIE,
      JSON.stringify({ name: displayName, role: target.role }),
      { ...COOKIE_OPTIONS, httpOnly: false }
    );

    return response;
  } catch (error) {
    console.error("[admin/login-as] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
