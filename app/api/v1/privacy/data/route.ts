import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByIp, rateLimitHeaders } from "@/lib/rate-limit";

/**
 * DELETE /api/v1/privacy/data
 *
 * GDPR / CCPA right to erasure ("delete my data"): removes or anonymizes the
 * signed-in user's personal data across the platform without destroying the
 * account or transactional records required for accounting.
 *
 * - Deleted: addresses, cart, wishlist, notifications, search history,
 *   newsletter subscription, contact messages, consent preferences.
 * - Anonymized: profile display fields (name, phone, photo, dob).
 * - Retained: orders/order items (finance/accounting), reviews (kept but no
 *   longer attributed), consent_audit (compliance record, no PII).
 */
export async function DELETE(request: NextRequest) {
  const rate = await rateLimitByIp(request, 3, 60 * 1000);
  if (!rate.success) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(rate) }
    );
  }

  try {
    const supabase = await createClient();
    const admin = createAdminClient();

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

    const body = await request.json();
    if (body?.confirm !== "DELETE") {
      return NextResponse.json(
        { success: false, error: 'Confirm with { "confirm": "DELETE" }' },
        { status: 400 }
      );
    }

    const summary: Record<string, number> = {};

    // Orders must drop their address references before the rows are deleted.
    await admin
      .from("orders")
      .update({ shipping_address_id: null, billing_address_id: null, notes: null, tracking_number: null })
      .eq("user_id", user.id);

    for (const [table, where] of [
      ["addresses", { user_id: user.id }],
      ["cart_items", { user_id: user.id }],
      ["wishlist_items", { user_id: user.id }],
      ["notifications", { user_id: user.id }],
      ["search_history", { user_id: user.id }],
      ["review_helpful", { user_id: user.id }],
      ["review_reports", { reporter_user_id: user.id }],
      ["blog_comments", { user_id: user.id }],
      ["user_consents", { user_id: user.id }],
    ] as const) {
      const whereClause = where as Record<string, unknown>;
      const { count } = await admin
        .from(table)
        .select("id", { count: "exact", head: true })
        .match(whereClause);
      const { error } = await admin.from(table).delete().match(whereClause);
      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      summary[table] = count ?? 0;
    }

    // Email-linked records.
    const [{ count: newsletterCount }, { count: contactCount }] = await Promise.all([
      admin
        .from("newsletter_subscribers")
        .select("id", { count: "exact", head: true })
        .eq("email", user.email),
      admin
        .from("contact_submissions")
        .select("id", { count: "exact", head: true })
        .eq("email", user.email),
    ]);
    await admin.from("newsletter_subscribers").delete().eq("email", user.email);
    await admin.from("contact_submissions").delete().eq("email", user.email);
    summary["newsletter_subscribers"] = newsletterCount ?? 0;
    summary["contact_submissions"] = contactCount ?? 0;

    // Anonymize the profile display fields (email stays — it is the auth identity).
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        first_name: "Deleted",
        last_name: "User",
        phone: null,
        profile_image_url: null,
        date_of_birth: null,
      })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json(
        { success: false, error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message:
          "Your personal data has been erased. You remain signed in; account deletion is available in Account Settings.",
        erased: summary,
        retained: [
          "orders and order items (required for accounting and tax records)",
          "reviews you left (kept, no longer attributed to you)",
          "consent audit log (compliance record, no personal data)",
        ],
      },
      meta: { remaining: rate.remaining },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}