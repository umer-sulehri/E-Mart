import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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
      .from("addresses")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      label,
      firstName,
      lastName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      is_default,
    } = body;

    if (is_default) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    const updates: Record<string, unknown> = {};
    if (label !== undefined) updates.label = label;
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;
    if (phone !== undefined) updates.phone = phone;
    if (addressLine1 !== undefined) updates.address_line1 = addressLine1;
    if (addressLine2 !== undefined) updates.address_line2 = addressLine2;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (postalCode !== undefined) updates.postal_code = postalCode;
    if (country !== undefined) updates.country = country;
    if (is_default !== undefined) updates.is_default = is_default;
    updates.updated_at = new Date().toISOString();

    const { data: address, error } = await supabase
      .from("addresses")
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

    return NextResponse.json({ success: true, data: address, message: "Address updated" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Address deleted" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
