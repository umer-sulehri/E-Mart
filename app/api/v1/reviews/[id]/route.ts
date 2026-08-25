import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    if (review.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "You can only edit your own reviews" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rating, title, comment } = body;

    const updates: Record<string, unknown> = {};
    if (rating !== undefined) updates.rating = rating;
    if (title !== undefined) updates.title = title;
    if (comment !== undefined) updates.comment = comment;
    updates.updated_at = new Date().toISOString();

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

    return NextResponse.json({ success: true, data: updated, message: "Review updated" });
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
