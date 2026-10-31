import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema } from "@/lib/validators";
import { rateLimitByIp, rateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limit = await rateLimitByIp(request, 5, 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please try again later." },
        { status: 429, headers: rateLimitHeaders(limit) }
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, role } = parsed.data;
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    // The profile row carries PII columns (phone) that are no longer part of
    // the authenticated role's SELECT grant, so it is read through the
    // service-role client right after the session was proven above.
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    // Blocked accounts never get a usable session, regardless of role.
    if (profile?.is_blocked) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          success: false,
          error: "This account has been suspended. Please contact support.",
        },
        { status: 403 }
      );
    }

    // Role scoping: the account's actual role must match the selected role.
    // This prevents an admin/seller from signing into the buyer flow (and vice-versa).
    if (profile?.role && role !== profile.role) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          success: false,
          error: `This account is registered as ${
            profile.role === "customer" ? "a buyer" : `an ${profile.role}`
          }. Please use the correct login option.`,
        },
        { status: 403 }
      );
    }

    // Seller status check: only an approved store may sign in to the seller
    // area. Pending applications stay locked until an admin verifies them.
    if (profile?.role === "seller") {
      const { data: vendor } = await supabase
        .from("vendors")
        .select("status")
        .eq("user_id", data.user.id)
        .maybeSingle();

      const sellerStatus = vendor?.status;

      if (!vendor || sellerStatus !== "approved") {
        await supabase.auth.signOut();
        return NextResponse.json(
          {
            success: false,
            error:
              sellerStatus === "suspended"
                ? "Your seller account has been suspended. Contact support."
                : sellerStatus === "rejected"
                  ? "Your seller application was not approved. Contact support."
                  : sellerStatus === "pending"
                    ? "Your seller application is pending approval. You will be notified once it is reviewed."
                    : "Your seller store is not available. Contact support.",
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: profile?.first_name,
          lastName: profile?.last_name,
          role: profile?.role,
          isEmailVerified: profile?.is_email_verified ?? false,
          profileImageUrl: profile?.profile_image_url,
          phone: profile?.phone,
          createdAt: profile?.created_at,
          updatedAt: profile?.updated_at,
        },
        session: data.session,
      },
    });
  } catch (error) {
    console.error("[auth/login] ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
