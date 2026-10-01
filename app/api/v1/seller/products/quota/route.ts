import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getProductUploadQuota,
  exemptQuotaStatus,
  isQuotaExempt,
  MAX_PRODUCTS_PER_DAY,
} from "@/lib/seller-quota";

/**
 * Daily product-upload allowance for the signed-in seller.
 *
 * Read-only: reports remaining uploads and when the allowance next frees up so
 * the seller dashboard can render a live quota bar and disable the upload
 * button before a doomed submit happens.
 */
export async function GET(_request: NextRequest) {
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "seller" && profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

    // Admins are exempt by default (see isQuotaExempt), so their bar never shows
// as exhausted and the upload button is never disabled for them.
const quota = isQuotaExempt(profile?.role)
      ? exemptQuotaStatus(MAX_PRODUCTS_PER_DAY)
      : await getProductUploadQuota(supabase, vendor.id);

    return NextResponse.json({
      success: true,
      data: {
        used: quota.used,
        limit: quota.limit,
        remaining: quota.remaining,
        resetAt: quota.resetAt === null ? null : new Date(quota.resetAt).toISOString(),
        exhausted: !quota.exempt && quota.remaining === 0,
        exempt: quota.exempt === true,
        // When the day window rolls over, in the quota timezone. Lets the UI
        // say "resets at midnight PKT" without duplicating the zone logic.
        timezone: "Asia/Karachi",
      },
      meta: {
        remaining: quota.remaining,
        limit: quota.limit,
        used: quota.used,
        resetAt: quota.resetAt === null ? null : new Date(quota.resetAt).toISOString(),
        retryAfterSec: quota.retryAfterSec,
      },
    });
  } catch (error) {
    console.error("[v1/seller/products/quota/route] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
