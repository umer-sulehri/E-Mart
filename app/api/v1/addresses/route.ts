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

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    } = body;

    if (!firstName || !lastName || !addressLine1 || !city || !state || !postalCode || !country) {
      return NextResponse.json(
        { success: false, error: "Missing required address fields" },
        { status: 400 }
      );
    }

    const { data: address, error } = await supabase
      .from("addresses")
      .insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        state,
        postal_code: postalCode,
        country,
        is_default: false,
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
      { success: true, data: address, message: "Address created" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
