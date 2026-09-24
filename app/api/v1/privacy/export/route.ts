import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitByIp, rateLimitHeaders } from "@/lib/rate-limit";

/**
 * GET /api/v1/privacy/export
 *
 * GDPR / CCPA right of access: returns a machine-readable copy of every
 * category of personal data E-Mart holds about the signed-in user.
 */
export async function GET(request: NextRequest) {
  const rate = await rateLimitByIp(request, 30, 60 * 1000);
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

    const [profileRes, addressesRes, ordersRes, reviewsRes, searchRes, consentRes] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, first_name, last_name, phone, profile_image_url, date_of_birth, created_at")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("addresses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("reviews")
          .select("id, product_id, rating, title, comment, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("search_history")
          .select("id, query, results_count, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("user_consents")
          .select("preferences, method, source, region, banner_version, created_at, updated_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
      ]);

    const orders = ordersRes.data || [];
    const orderIds = orders.map((o: { id: string }) => o.id);

    let orderItems: unknown[] = [];
    if (orderIds.length > 0) {
      const { data } = await supabase
        .from("order_items")
        .select(
          "order_id, product_id, product_name, price, quantity, discount, total, created_at"
        )
        .in("order_id", orderIds);
      orderItems = data || [];
    }

    const [newsletterRes, contactRes, auditRes] = await Promise.all([
      admin
        .from("newsletter_subscribers")
        .select("id, email, is_active, created_at")
        .eq("email", user.email)
        .maybeSingle(),
      admin
        .from("contact_submissions")
        .select("id, name, email, subject, message, is_resolved, created_at")
        .eq("email", user.email),
      admin
        .from("consent_audit")
        .select("action, method, source, previous, next, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
    ]);

    const exportedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      data: {
        exported_at: exportedAt,
        format_version: "1.0",
        generated_by: "E-Mart Data Subject Access Request",
        profile: profileRes.data ?? null,
        addresses: addressesRes.data || [],
        orders: orders.map((o: Record<string, unknown>) => ({
          ...o,
        })),
        order_items: orderItems,
        reviews: reviewsRes.data || [],
        search_history: searchRes.data || [],
        consents: consentRes.data || [],
        consent_audit: auditRes.data || [],
        newsletter_subscription: newsletterRes.data ?? null,
        contact_submissions: contactRes.data || [],
        auth_metadata: {
          email: user.email,
          created_at: user.created_at,
        },
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