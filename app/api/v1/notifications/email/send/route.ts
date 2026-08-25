import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
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
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { user_id, subject, body: emailBody } = body;

    if (!user_id || !subject || !emailBody) {
      return NextResponse.json(
        { success: false, error: "user_id, subject, and body are required" },
        { status: 400 }
      );
    }

    const { data: targetUser, error: userError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", user_id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { success: false, error: "Target user not found" },
        { status: 404 }
      );
    }

    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id,
        type: "system",
        title: subject,
        message: emailBody,
        data: JSON.stringify({
          channel: "email",
          to: targetUser.email,
          subject,
          body: emailBody,
          sent_by: user.id,
        }),
      })
      .select()
      .single();

    if (notifError) {
      return NextResponse.json(
        { success: false, error: notifError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification,
      message: "Email notification queued successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
