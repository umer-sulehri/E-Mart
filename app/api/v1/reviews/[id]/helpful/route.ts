import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data: existing } = await supabase
      .from("review_helpful")
      .select("id, helpful")
      .eq("review_id", id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("review_helpful")
        .update({ helpful: !existing.helpful })
        .eq("id", existing.id);

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Helpful toggled",
        data: { helpful: !existing.helpful },
      });
    }

    const { error } = await supabase.from("review_helpful").insert({
      review_id: id,
      user_id: user.id,
      helpful: true,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Marked as helpful", data: { helpful: true } },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
