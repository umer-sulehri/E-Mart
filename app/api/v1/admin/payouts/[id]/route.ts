import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAdminLog } from "@/lib/audit";

const VALID_STATUSES = ["pending", "processing", "completed", "failed"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `status must be one of ${VALID_STATUSES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updates.status = body.status;
      if (["completed", "failed"].includes(body.status)) {
        updates.processed_at = new Date().toISOString();
      }
    }

    if (body.notes !== undefined) updates.notes = body.notes;

    const { data: payout, error } = await supabase
      .from("seller_payouts")
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

    if (!payout) {
      return NextResponse.json(
        { success: false, error: "Payout not found" },
        { status: 404 }
      );
    }

    await writeAdminLog(supabase, user.id, {
      action: "update_payout",
      entityType: "payout",
      entityId: payout.id,
      details: {
        amount: Number(payout.amount || 0),
        method: payout.method,
        status: payout.status,
        old_status: body._oldStatus || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: payout.id, status: payout.status, processed_at: payout.processed_at },
    });
  } catch (error) {
    console.error("[v1/admin/payouts PATCH] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
