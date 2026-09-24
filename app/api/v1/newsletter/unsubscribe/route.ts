import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByIp, rateLimitHeaders } from "@/lib/rate-limit";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

/**
 * POST /api/v1/newsletter/unsubscribe
 *
 * CAN-SPAM / GDPR opt-out. Two ways to unsubscribe:
 *   { email, confirm: "UNSUBSCRIBE" }  – signed-in user, email must match their
 *                                       session so the record can be verified,
 *   { token }                           – HMAC token from an email link; works
 *                                       for anyone who received the email.
 */
export async function POST(request: NextRequest) {
  const rate = await rateLimitByIp(request, 5, 60 * 1000);
  if (!rate.success) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(rate) }
    );
  }

  try {
    const body = await request.json();
    let email: string | null = null;

    if (typeof body?.token === "string") {
      email = verifyUnsubscribeToken(body.token);
      if (!email) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired unsubscribe link" },
          { status: 400 }
        );
      }
    } else {
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
      if (body?.confirm !== "UNSUBSCRIBE") {
        return NextResponse.json(
          { success: false, error: 'Confirm with { "confirm": "UNSUBSCRIBE" }' },
          { status: 400 }
        );
      }
      const requestedEmail =
        typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
      email = user.email ? user.email.toLowerCase().trim() : "";
      if (!email) {
        return NextResponse.json(
          { success: false, error: "Could not determine your email address" },
          { status: 400 }
        );
      }
      if (requestedEmail && requestedEmail !== email) {
        return NextResponse.json(
          { success: false, error: "That email does not match your account" },
          { status: 403 }
        );
      }
    }

    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("newsletter_subscribers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({
        success: true,
        message: "This email is not on our newsletter list",
        data: { email },
      });
    }

    const { error } = await admin
      .from("newsletter_subscribers")
      .update({ is_active: false })
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "You have been unsubscribed from the newsletter",
      data: { email },
      meta: { remaining: rate.remaining },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}