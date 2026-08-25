import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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

    const { data: preferences, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const defaults = {
      email_orders: true,
      email_promotions: true,
      email_newsletter: true,
      push_orders: true,
      push_promotions: false,
      sms_orders: true,
      sms_promotions: false,
    };

    return NextResponse.json({
      success: true,
      data: preferences || { user_id: user.id, ...defaults },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { email_orders, email_promotions, email_newsletter, push_orders, push_promotions, sms_orders, sms_promotions } = body;

    const updates: Record<string, unknown> = { user_id: user.id };
    if (email_orders !== undefined) updates.email_orders = email_orders;
    if (email_promotions !== undefined) updates.email_promotions = email_promotions;
    if (email_newsletter !== undefined) updates.email_newsletter = email_newsletter;
    if (push_orders !== undefined) updates.push_orders = push_orders;
    if (push_promotions !== undefined) updates.push_promotions = push_promotions;
    if (sms_orders !== undefined) updates.sms_orders = sms_orders;
    if (sms_promotions !== undefined) updates.sms_promotions = sms_promotions;
    updates.updated_at = new Date().toISOString();

    const { data: existing } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let result;

    if (existing) {
      const { data, error } = await supabase
        .from("notification_preferences")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      result = data;
    } else {
      const { data, error } = await supabase
        .from("notification_preferences")
        .insert(updates)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Preferences updated",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
