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

    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { success: false, error: "reason is required" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("review_reports")
      .select("id")
      .eq("review_id", id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Review already reported" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("review_reports").insert({
      review_id: id,
      user_id: user.id,
      reason,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Review reported" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
