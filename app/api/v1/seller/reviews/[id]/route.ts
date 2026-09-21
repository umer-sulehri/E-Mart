import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_STATUSES = ["pending", "approved", "flagged", "rejected"];

/**
 * Verify the caller is a seller (or admin) and that the target review belongs
 * to a product owned by that seller's vendor. Returns the profile + vendor for
 * authorized callers, or a NextResponse error to short-circuit.
 */
async function authorizeReviewOwner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reviewId: string
): Promise<
  | { ok: true; vendorId: string }
  | { ok: false; response: NextResponse }
> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      ),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "seller" && profile?.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      ),
    };
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!vendor) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      ),
    };
  }

  const { data: review } = await supabase
    .from("reviews")
    .select("id, products!inner(vendor_id)")
    .eq("id", reviewId)
    .single();

  if (
    !review ||
    (review.products as unknown as { vendor_id: string }).vendor_id !== vendor.id
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Review not found or unauthorized" },
        { status: 404 }
      ),
    };
  }

  return { ok: true, vendorId: vendor.id };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const auth = await authorizeReviewOwner(supabase, id);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { reply } = body;

    if (!reply || reply.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Reply text is required" },
        { status: 400 }
      );
    }

    // Sellers aren't the review author, so the reply update is admin-only RLS.
    // Ownership was verified above via the user-scoped client.
    const admin = createAdminClient();

    const { data: updatedReview, error } = await admin
      .from("reviews")
      .update({
        seller_reply: reply,
        seller_reply_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: "Reply added successfully",
    });
  } catch (error) {
    console.error("[v1/seller/reviews/[id]/route] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const auth = await authorizeReviewOwner(supabase, id);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    // Sellers can't update rows they don't author under RLS, so run the
    // moderation mutation through the service-role client after ownership is
    // confirmed above.
    const admin = createAdminClient();

    const { data: updatedReview, error } = await admin
      .from("reviews")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: "Review updated successfully",
    });
  } catch (error) {
    console.error("[v1/seller/reviews/[id]/route] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const auth = await authorizeReviewOwner(supabase, id);
    if (!auth.ok) return auth.response;

    const admin = createAdminClient();
    const { error } = await admin
      .from("reviews")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("[v1/seller/reviews/[id]/route] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}