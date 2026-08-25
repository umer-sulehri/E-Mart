import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { moderationStatus, moderationNotes } = body;

    if (!moderationStatus) {
      return NextResponse.json(
        { success: false, error: "moderationStatus is required" },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "approved", "flagged", "removed"];
    if (!validStatuses.includes(moderationStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      moderation_status: moderationStatus,
      updated_at: new Date().toISOString(),
    };

    if (moderationNotes !== undefined) {
      updates.moderation_notes = moderationNotes;
    }

    if (moderationStatus === "approved") {
      updates.is_active = true;
    } else if (["flagged", "removed"].includes(moderationStatus)) {
      updates.is_active = false;
    }

    const { data: product, error } = await supabase
      .from("products")
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
      data: product,
      message: "Moderation status updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
