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

    const { data: addresses, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: addresses || [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();

    // Accept snake_case (dashboard form + DB columns) with camelCase fallback
    // for backward compatibility with any camelCase callers.
    const label = body.label ?? body.addressLabel ?? null;
    const first_name = body.first_name ?? body.firstName ?? "";
    const last_name = body.last_name ?? body.lastName ?? "";
    const phone = body.phone ?? "";
    const address_line1 = body.address_line1 ?? body.addressLine1 ?? "";
    const address_line2 = body.address_line2 ?? body.addressLine2 ?? null;
    const city = body.city ?? "";
    const state = body.state ?? "";
    const postal_code = body.postal_code ?? body.postalCode ?? "";
    const country = body.country ?? "Pakistan";
    const is_default = !!body.is_default;

    if (!first_name || !last_name || !address_line1 || !city) {
      return NextResponse.json(
        { success: false, error: "Missing required address fields" },
        { status: 400 }
      );
    }

    if (is_default) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    const { data: address, error } = await supabase
      .from("addresses")
      .insert({
        user_id: user.id,
        label: label || "Home",
        first_name,
        last_name,
        phone: phone || null,
        address_line1,
        address_line2: address_line2 || null,
        city,
        state: state || "Punjab",
        postal_code: postal_code || null,
        country: country || "Pakistan",
        is_default,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: address, message: "Address added successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
