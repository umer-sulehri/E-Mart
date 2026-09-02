import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    const { data: existing, error: fetchError } = await supabase
      .from("addresses")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot edit this address" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Partial update support (e.g. setting default). Only include provided fields.
    const patch: Record<string, unknown> = {};
    if ("label" in body && body.label != null) patch.label = body.label;
    if ("first_name" in body) patch.first_name = body.first_name;
    if ("last_name" in body) patch.last_name = body.last_name;
    if ("phone" in body) patch.phone = body.phone ?? null;
    if ("address_line1" in body) patch.address_line1 = body.address_line1;
    if ("address_line2" in body) patch.address_line2 = body.address_line2 ?? null;
    if ("city" in body) patch.city = body.city;
    if ("state" in body) patch.state = body.state;
    if ("postal_code" in body) patch.postal_code = body.postal_code ?? null;
    if ("country" in body) patch.country = body.country;
    if ("is_default" in body) patch.is_default = !!body.is_default;

    // If setting this as default, clear others first.
    if (patch.is_default === true) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .neq("id", id);
    }

    const { data: address, error } = await supabase
      .from("addresses")
      .update(patch)
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
      data: address,
      message: "Address updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    const { data: existing, error: fetchError } = await supabase
      .from("addresses")
      .select("id, user_id, is_default")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Address not found" },
        { status: 404 }
      );
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot delete this address" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
