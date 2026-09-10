import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reviewSchema } from "@/lib/validators";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    const { data: review, error: fetchError } = await supabase
      .from("reviews")
      .select("user_id, status, created_at")
      .eq("id", id)
      .single();

    if (fetchError || !review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    if (review.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "You can only edit your own reviews" },
        { status: 403 }
      );
    }

    if (review.status === "rejected") {
      return NextResponse.json(
        { success: false, error: "This review was not approved and cannot be edited." },
        { status: 403 }
      );
    }

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const createdAt = new Date(review.created_at).getTime();
    if (Date.now() - createdAt > THIRTY_DAYS_MS) {
      return NextResponse.json(
        { success: false, error: "Reviews can only be edited within 30 days of posting." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = reviewSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.rating !== undefined) updates.rating = input.rating;
    if (input.title !== undefined) updates.title = input.title;
    if (input.comment !== undefined) updates.comment = input.comment;
    // Editing puts the review back through moderation.
    updates.status = "pending";

    const { data: updated, error } = await supabase
      .from("reviews")
      .update(updates)
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
      data: { ...updated, requires_approval: true },
      message: "Review updated and sent for approval",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    const { data: review } = await supabase
      .from("reviews")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";
    const isOwner = review.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Not authorized to delete this review" },
        { status: 403 }
      );
    }

    const { error } = await supabase.from("reviews").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Review deleted" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
