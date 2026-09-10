import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: review } = await supabase
      .from("reviews")
      .select("id, helpful_count")
      .eq("id", id)
      .single();

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    // review_helpful is a vote table (review_id, user_id) with no toggling
    // column, so a toggle is an insert-or-delete.
    const { data: existing } = await supabase
      .from("review_helpful")
      .select("id")
      .eq("review_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    // Users hold no UPDATE rights on reviews owned by others, so the
    // helpful_count maintenance runs with the admin client.
    const admin = createAdminClient();
    const nextCount = Math.max(
      0,
      (Number(review.helpful_count) || 0) + (existing ? -1 : 1)
    );

    if (existing) {
      const { error } = await supabase
        .from("review_helpful")
        .delete()
        .eq("id", existing.id);

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      await admin
        .from("reviews")
        .update({ helpful_count: nextCount })
        .eq("id", id);

      return NextResponse.json({
        success: true,
        message: "Removed helpful vote",
        data: { helpful: false, helpfulCount: nextCount },
      });
    }

    const { error: insertError } = await supabase.from("review_helpful").insert({
      review_id: id,
      user_id: user.id,
    });

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    await admin
      .from("reviews")
      .update({ helpful_count: nextCount })
      .eq("id", id);

    return NextResponse.json(
      {
        success: true,
        message: "Marked as helpful",
        data: { helpful: true, helpfulCount: nextCount },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}