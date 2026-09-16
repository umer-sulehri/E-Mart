import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml } from "@/lib/sanitize-html";

function clean(value: unknown): string {
  return typeof value === "string" ? sanitizeHtml(value.trim()) : "";
}

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "seller" && profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Seller access required" },
        { status: 403 }
      );
    }

    const { data: method, error } = await supabase
      .from("seller_payout_methods")
      .select("*")
      .eq("seller_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[v1/seller/payout/method] GET error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: method
        ? {
            seller_id: method.seller_id,
            preferred_method: method.preferred_method,
            bank_name: method.bank_name,
            account_title: method.account_title,
            account_number: method.account_number,
            iban: method.iban,
            easypaisa_phone: method.easypaisa_phone,
            jazzcash_phone: method.jazzcash_phone,
            updated_at: method.updated_at,
          }
        : null,
    });
  } catch (error) {
    console.error("[v1/seller/payout/method] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
      .maybeSingle();

    if (profile?.role !== "seller" && profile?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Seller access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const preferredMethod = clean(body.preferred_method || "bank");

    if (!["bank", "easypaisa", "jazzcash"].includes(preferredMethod)) {
      return NextResponse.json(
        { success: false, error: "Invalid payout method" },
        { status: 400 }
      );
    }

    const bankName = clean(body.bank_name);
    const accountTitle = clean(body.account_title);
    const accountNumber = clean(body.account_number);
    const iban = clean(body.iban);
    const easypaisaPhone = clean(body.easypaisa_phone);
    const jazzcashPhone = clean(body.jazzcash_phone);

    if (preferredMethod === "bank" && (!accountTitle || !accountNumber)) {
      return NextResponse.json(
        { success: false, error: "Bank account title and number are required" },
        { status: 400 }
      );
    }
    if (preferredMethod === "easypaisa" && !easypaisaPhone) {
      return NextResponse.json(
        { success: false, error: "Easypaisa mobile number is required" },
        { status: 400 }
      );
    }
    if (preferredMethod === "jazzcash" && !jazzcashPhone) {
      return NextResponse.json(
        { success: false, error: "JazzCash mobile number is required" },
        { status: 400 }
      );
    }

    const updates = {
      seller_id: user.id,
      preferred_method: preferredMethod,
      bank_name: bankName,
      account_title: accountTitle,
      account_number: accountNumber,
      iban: iban,
      easypaisa_phone: easypaisaPhone,
      jazzcash_phone: jazzcashPhone,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("seller_payout_methods")
      .upsert(updates, { onConflict: "seller_id" })
      .select()
      .single();

    if (error) {
      console.error("[v1/seller/payout/method] PATCH error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Payout method updated successfully",
    });
  } catch (error) {
    console.error("[v1/seller/payout/method] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}